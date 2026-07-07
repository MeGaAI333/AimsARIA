import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { Project, Quote, PricingBreakdown } from '../../../shared/types';
import { Material } from '../entities/Material';

export class PDFService {
  async generateQuotePDF(
    project: Project,
    quote: Quote,
    material: Material,
    companyName: string = 'Fence & Gate Installation'
  ): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `quote_${project.id}_${Date.now()}.pdf`;
    const filePath = path.join('generated_quotes', fileName);

    if (!fs.existsSync('generated_quotes')) {
      fs.mkdirSync('generated_quotes', { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(companyName, { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .text('Professional Fence & Gate Estimating Service', { align: 'center' })
      .moveDown();

    // Quote details
    doc.fontSize(14).font('Helvetica-Bold').text('ESTIMATE / QUOTE', { underline: true }).moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Quote #: ${quote.id}`);
    doc.text(`Project #: ${project.id}`);
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`);
    doc.text(`Expires: ${new Date(quote.expiresAt).toLocaleDateString()}`).moveDown();

    // Client information
    doc.fontSize(12).font('Helvetica-Bold').text('CLIENT INFORMATION', { underline: true }).moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${project.clientName}`);
    doc.text(`Email: ${project.clientEmail}`);
    doc.text(`Phone: ${project.clientPhone}`);
    doc.text(`Address: ${project.address}`).moveDown();

    // Project specifications
    doc.fontSize(12).font('Helvetica-Bold').text('PROJECT SPECIFICATIONS', { underline: true }).moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Material: ${material.name} (${project.specification.color})`);
    doc.text(`Fence Length: ${project.specification.length} feet`);
    doc.text(`Fence Width: ${project.specification.width} feet`);
    doc.text(`Height: ${project.specification.height} feet`);
    if (project.specification.gateCount > 0) {
      doc.text(`Gates: ${project.specification.gateCount} × ${project.specification.gateWidth} feet`);
    }
    if (project.specification.customNotes) {
      doc.text(`Notes: ${project.specification.customNotes}`);
    }
    doc.moveDown();

    // Pricing breakdown
    doc.fontSize(12).font('Helvetica-Bold').text('PRICING BREAKDOWN', { underline: true }).moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    const pricing = quote.pricing;
    const lineHeight = 15;
    const leftCol = 100;
    const rightCol = 400;

    doc.text('Material Cost:', leftCol, doc.y);
    doc.text(`$${pricing.materialCost.toFixed(2)}`, rightCol, doc.y - lineHeight);
    doc.moveDown();

    doc.text('Labor Cost:', leftCol, doc.y);
    doc.text(`$${pricing.laborCost.toFixed(2)}`, rightCol, doc.y - lineHeight);
    doc.moveDown();

    if (pricing.accessoriesCost > 0) {
      doc.text('Accessories Cost:', leftCol, doc.y);
      doc.text(`$${pricing.accessoriesCost.toFixed(2)}`, rightCol, doc.y - lineHeight);
      doc.moveDown();
    }

    doc.fontSize(10).font('Helvetica');
    doc.text('Subtotal:', leftCol, doc.y);
    doc.text(`$${pricing.subtotal.toFixed(2)}`, rightCol, doc.y - lineHeight);
    doc.moveDown();

    doc.text('Tax:', leftCol, doc.y);
    doc.text(`$${pricing.tax.toFixed(2)}`, rightCol, doc.y - lineHeight);
    doc.moveDown();

    // Total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL ESTIMATE:', leftCol, doc.y);
    doc.text(`$${pricing.total.toFixed(2)}`, rightCol, doc.y - lineHeight);
    doc.moveDown(2);

    // Footer
    doc.fontSize(8).font('Helvetica').text(
      'This estimate is valid for 30 days. Please contact us for questions or to proceed with the project.',
      { align: 'center' }
    );

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
      doc.end();
    });
  }
}
