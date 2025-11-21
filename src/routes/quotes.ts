import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { requireAuth } from '../middlewares/auth';
import { htmlToPdfBuffer } from '../utils/pdf';
import { sendMail } from '../utils/email';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });


// Helper function to generate professional HTML for quote emails
function generateQuoteEmailHTML(quote: any, customMessage?: string): string {
  const companyTemplates: Record<string, { name: string; fullName: string; address: string; rfc: string }> = {
    'CONDUIT LIFE': {
      name: 'CONDUIT LIFE',
      fullName: 'CONDUIT LIFE',
      address: 'Calle Principal #123, Col. Centro, Ciudad, Estado, C.P. 12345',
      rfc: 'CLF123456ABC'
    },
    'BIOSYSTEMS HLS': {
      name: 'BIOSYSTEMS HLS',
      fullName: 'BIOSYSTEMS HLS',
      address: 'Av. Tecnológico #456, Col. Industrial, Ciudad, Estado, C.P. 54321',
      rfc: 'BHS789012DEF'
    },
    'INGENIERÍA CLÍNICA Y DISEÑO': {
      name: 'INGENIERÍA CLÍNICA Y DISEÑO',
      fullName: 'INGENIERÍA CLÍNICA Y DISEÑO S.A. DE C.V.',
      address: 'Boulevard Innovación #789, Col. Empresarial, Ciudad, Estado, C.P. 67890',
      rfc: 'ICD345678GHI'
    },
    'ESCALA BIOMÉDICA': {
      name: 'ESCALA BIOMÉDICA',
      fullName: 'ESCALA BIOMÉDICA',
      address: 'Calle Salud #321, Col. Médica, Ciudad, Estado, C.P. 09876',
      rfc: 'EBM901234JKL'
    }
  };

  const companyName = (quote.sellerCompany?.name || '').toUpperCase();
  const companyInfo = companyTemplates[companyName] || {
    name: quote.sellerCompany?.name || 'Empresa Vendedora',
    fullName: quote.sellerCompany?.name || 'Empresa Vendedora',
    address: '',
    rfc: ''
  };

  const subtotal = Number(quote.total || 0);
  const iva = subtotal * 0.16;
  const totalConIva = subtotal + iva;

  const itemsHTML = (quote.items || []).map((item: any) => {
    const productCode = item.product?.code || item.productId || 'S/C';
    const quantity = item.quantity || 0;
    const unitPrice = Number(item.unitPrice || 0);
    const itemSubtotal = quantity * unitPrice;
    
    return `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${productCode}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.description || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">$${unitPrice.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">$${itemSubtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
      </tr>
    `;
  }).join('');

  const createdDate = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Cotización ${quote.folio || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .company-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1e40af; }
    .company-info h2 { color: #1e40af; margin-bottom: 10px; }
    .quote-info { display: flex; justify-content: space-between; background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .quote-info strong { color: #1e40af; display: block; margin-bottom: 5px; }
    .message-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 14px; font-weight: bold; }
    th.right, td.right { text-align: right; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-section { margin-top: 30px; display: flex; justify-content: flex-end; }
    .total-box { background: #f9fafb; padding: 20px; border-radius: 8px; min-width: 300px; border: 2px solid #e5e7eb; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { border-top: 2px solid #1e40af; margin-top: 10px; padding-top: 12px; font-size: 18px; font-weight: bold; color: #1e40af; }
    footer { margin-top: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; border-top: 3px solid #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyInfo.fullName}</h1>
      <p>Cotización Profesional</p>
    </div>
    <div class="company-info">
      <h2>${companyInfo.name}</h2>
      <div>${companyInfo.address}</div>
      <div>RFC: ${companyInfo.rfc}</div>
    </div>
    <div class="quote-info">
      <div><strong>Folio:</strong> ${quote.folio || ''}</div>
      <div><strong>Fecha:</strong> ${createdDate}</div>
      <div><strong>Vendedor:</strong> ${quote.seller || ''}</div>
      <div><strong>Cliente:</strong> ${quote.clientName || quote.client?.name || ''}</div>
    </div>
    ${customMessage ? `<div class="message-box"><p>${customMessage}</p></div>` : ''}
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción</th>
          <th class="right">Cantidad</th>
          <th class="right">Precio Unit.</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>
    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Subtotal:</span><span>$${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
        <div class="total-row"><span>IVA (16%):</span><span>$${iva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
        <div class="total-row final"><span>TOTAL:</span><span>$${totalConIva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
      </div>
    </div>
    <footer>
      <strong>Observaciones:</strong>
      <div>${quote.terms || 'Ninguna'}</div>
    </footer>
  </div>
</body>
</html>`;
}

const router = Router();

function genFolio() {
  return 'F' + Date.now().toString(36).toUpperCase();
}

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    // Validate foreign keys before attempting create to provide clearer errors
    const sellerCompanyId = payload.sellerCompanyId;
    const clientId = payload.clientId;
    const sellerId = payload.sellerId;

    if (sellerCompanyId) {
      const sc = await prisma.company.findUnique({ where: { id: Number(sellerCompanyId) } });
      if (!sc) return res.status(400).json({ success: false, error: 'sellerCompanyId not found' });
    }
    if (clientId) {
      const c = await prisma.client.findUnique({ where: { id: Number(clientId) } });
      if (!c) return res.status(400).json({ success: false, error: 'clientId not found' });
    }
    if (sellerId) {
      const s = await prisma.user.findUnique({ where: { id: Number(sellerId) } });
      if (!s) return res.status(400).json({ success: false, error: 'sellerId not found' });
    }
    // create quote and items
    const folio = genFolio();
    const items = payload.products || [];
    let subtotal = 0;
    const created = await prisma.quote.create({
      data: {
        folio,
        sellerCompanyId: payload.sellerCompanyId,
        clientId: payload.clientId,
        sellerId: payload.sellerId,
        status: payload.status || 'draft',
        subtotal: 0,
        taxes: payload.taxes || 0,
        total: 0,
        items: { create: items.map((it: any) => ({ productId: it.productId, description: it.description || it.name || '-', qty: it.qty, unitPrice: it.unitPrice, discount: it.discount || 0, total: (it.qty * it.unitPrice) - (it.discount || 0) })) }
      },
      include: { items: true }
    });
    subtotal = created.items.reduce((s: any, i: any) => s + i.total, 0);
    const taxes = payload.taxes || 0;
    const total = subtotal + taxes;
    const updated = await prisma.quote.update({ where: { id: created.id }, data: { subtotal, taxes, total } , include: { items: true } });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    // Handle Prisma foreign key error with clearer response
    if (err && err.code === 'P2003') {
      const field = err.meta?.field_name || 'unknown';
      return res.status(400).json({ success: false, error: `Foreign key constraint violated: ${field}` });
    }
    next(err);
  }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotes = await prisma.quote.findMany({ 
      include: { 
        items: {
          include: {
            product: true
          }
        },
        client: true,
        seller: true,
        sellerCompany: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: quotes });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({ 
      where: { id }, 
      include: { 
        items: {
          include: {
            product: true
          }
        }, 
        client: true, 
        seller: true, 
        sellerCompany: true 
      } 
    });
    if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: quote });
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const quote = await prisma.quote.update({ 
      where: { id }, 
      data,
      include: { 
        items: {
          include: {
            product: true
          }
        }, 
        client: true, 
        seller: true, 
        sellerCompany: true 
      }
    });
    res.json({ success: true, data: quote });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await prisma.quote.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) { next(err); }
});

router.get('/:id/pdf', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({ where: { id }, include: { items: true, client: true, sellerCompany: true } });
    if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
    // basic HTML template
    const html = `<html><body><h1>Quote ${quote.folio}</h1><p>Client: ${quote.client?.name || ''}</p><table border="1" cellpadding="6"><thead><tr><th>Desc</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${quote.items.map((i: any)=>`<tr><td>${i.description}</td><td>${i.qty}</td><td>${i.unitPrice}</td><td>${i.total}</td></tr>`).join('')}</tbody></table><h3>Total: ${quote.total}</h3></body></html>`;
    const buffer = await htmlToPdfBuffer(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quote-${quote.folio}.pdf`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// Endpoint para recibir PDF generado en el frontend
router.post('/:id/send-email-with-pdf', requireAuth, upload.single('pdf'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { to, subject, message } = req.body;
    const pdfFile = req.file;
    
    if (!pdfFile) {
      return res.status(400).json({ success: false, error: 'No se recibió el archivo PDF' });
    }
    
    // Fetch quote basic info
    const quote = await prisma.quote.findUnique({ 
      where: { id }, 
      select: { folio: true, sellerCompany: { select: { name: true } } }
    });
    
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }
    
    console.log(`📧 Enviando email con PDF generado en frontend: ${pdfFile.originalname} (${pdfFile.size} bytes)`);
    
    // Send email with the received PDF
    const info = await sendMail(
      to, 
      subject || `Cotización ${quote.folio} - ${quote.sellerCompany?.name || ''}`, 
      message || 'Adjunto encontrará la cotización solicitada.',
      [{ filename: pdfFile.originalname, content: pdfFile.buffer }]
    );
    
    // Log the email
    await prisma.emailLog.create({ 
      data: { 
        to, 
        subject: subject || '', 
        body: message || '', 
        attachments: pdfFile.originalname
      } 
    });
    
    res.json({ success: true, message: 'Email enviado con PDF adjunto', data: info });
  } catch (err) { 
    console.error('❌ Error sending email with PDF:', err);
    next(err); 
  }
});

router.post('/:id/send-email', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { to, subject, message } = req.body;
    
    // Fetch quote with all relations including product codes
    const quote = await prisma.quote.findUnique({ 
      where: { id }, 
      include: { 
        items: { include: { product: true } }, 
        client: true, 
        sellerCompany: true 
      } 
    });
    
    if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
    
    // Generate professional HTML with company branding
    const html = generateQuoteEmailHTML(quote, message);
    const pdf = await htmlToPdfBuffer(html);
    
    const info = await sendMail(
      to, 
      subject || `Cotización ${quote.folio} - ${quote.sellerCompany?.name || ''}`, 
      html, 
      [{ filename: `cotizacion-${quote.folio}.pdf`, content: pdf }]
    );
    
    await prisma.emailLog.create({ 
      data: { 
        to, 
        subject: subject || '', 
        body: message || '', 
        attachments: `cotizacion-${quote.folio}.pdf` 
      } 
    });
    
    res.json({ success: true, message: 'Email enviado', data: info });
  } catch (err) { 
    console.error('Error sending quote email:', err);
    next(err); 
  }
});

export default router;
