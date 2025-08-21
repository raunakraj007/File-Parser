const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');
const File = require('../models/File');

class FileParser {
  constructor(io) {
    this.io = io;
  }

  async parseFile(fileId, filePath, mimetype) {
    try {
      const file = await File.findOne({ fileId });
      if (!file) throw new Error('File not found');

      // Update status to processing
      await this.updateProgress(fileId, 10, 'processing');

      let parsedContent = null;
      let metadata = {};

      switch (mimetype) {
        case 'text/csv':
          parsedContent = await this.parseCSV(filePath, fileId);
          metadata = this.getCSVMetadata(parsedContent);
          break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          parsedContent = await this.parseExcel(filePath, fileId);
          metadata = this.getExcelMetadata(parsedContent);
          break;
        case 'application/pdf':
          parsedContent = await this.parsePDF(filePath, fileId);
          metadata = this.getPDFMetadata(parsedContent);
          break;
        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }

      // Final update
      await File.findOneAndUpdate(
        { fileId },
        {
          status: 'ready',
          progress: 100,
          parsedContent,
          metadata,
          error: null
        }
      );

      this.io.emit('fileProgress', {
        fileId,
        status: 'ready',
        progress: 100
      });

      return parsedContent;
    } catch (error) {
      console.error('Parsing error:', error);
      
      await File.findOneAndUpdate(
        { fileId },
        {
          status: 'failed',
          error: error.message
        }
      );

      this.io.emit('fileProgress', {
        fileId,
        status: 'failed',
        progress: 0,
        error: error.message
      });

      // Do not rethrow to avoid unhandled promise rejections crashing the process
      return null;
    }
  }

  async parseCSV(filePath, fileId) {
    return new Promise((resolve, reject) => {
      const results = [];
      let rowCount = 0;
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
          rowCount++;
          
          // Update progress every 100 rows
          if (rowCount % 100 === 0) {
            const progress = Math.min(90, 20 + (rowCount / 1000) * 70);
            this.updateProgress(fileId, progress, 'processing');
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', reject);
    });
  }

  async parseExcel(filePath, fileId) {
    try {
      await this.updateProgress(fileId, 30, 'processing');
      
      const workbook = XLSX.readFile(filePath);
      const results = {};
      
      let sheetCount = 0;
      const totalSheets = workbook.SheetNames.length;
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        results[sheetName] = jsonData;
        
        sheetCount++;
        const progress = 30 + (sheetCount / totalSheets) * 60;
        await this.updateProgress(fileId, progress, 'processing');
      }
      
      return results;
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  async parsePDF(filePath, fileId) {
    try {
      await this.updateProgress(fileId, 30, 'processing');
      
      const dataBuffer = fs.readFileSync(filePath);
      await this.updateProgress(fileId, 60, 'processing');
      
      const data = await pdfParse(dataBuffer);
      await this.updateProgress(fileId, 90, 'processing');
      
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async updateProgress(fileId, progress, status) {
    await File.findOneAndUpdate(
      { fileId },
      { progress, status }
    );

    this.io.emit('fileProgress', {
      fileId,
      status,
      progress
    });
  }

  getCSVMetadata(data) {
    if (!data || data.length === 0) return { rows: 0, columns: 0, headers: [] };
    
    return {
      rows: data.length,
      columns: Object.keys(data[0]).length,
      headers: Object.keys(data[0]),
      fileType: 'CSV'
    };
  }

  getExcelMetadata(data) {
    let totalRows = 0;
    let maxColumns = 0;
    const sheetNames = Object.keys(data);
    
    for (const sheetName of sheetNames) {
      const sheetData = data[sheetName];
      totalRows += sheetData.length;
      if (sheetData.length > 0) {
        maxColumns = Math.max(maxColumns, Object.keys(sheetData[0]).length);
      }
    }
    
    return {
      rows: totalRows,
      columns: maxColumns,
      sheets: sheetNames.length,
      sheetNames,
      fileType: 'Excel'
    };
  }

  getPDFMetadata(data) {
    return {
      pages: data.pages,
      characters: data.text.length,
      words: data.text.split(/\s+/).length,
      fileType: 'PDF'
    };
  }
}

module.exports = FileParser;