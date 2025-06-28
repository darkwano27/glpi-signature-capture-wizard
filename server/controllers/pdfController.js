
const puppeteer = require('puppeteer');
const { localDb } = require('../config/db');
const mailService = require('../services/mailService');

// Generate PDF and send email
exports.generatePdf = async (req, res) => {
  const { technician, user, assets, technicianSignature, userSignature } = req.body;

  const date = new Date().toLocaleDateString('es-PE'); // o el formato que prefieras
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Formato de Entrega y Devolución de Bienes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
            position: relative;
            padding: 15px;
            max-width: 21cm;
            min-height: 29.7cm;
            margin: 0 auto;
            line-height: 1.3;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding: 15px 0;
            border-bottom: 2px solid #009688;
        }
        
        .logo {
            background: #009688;
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 18px;
            letter-spacing: 3px;
            border-radius: 3px;
            position: relative;
        }
        
        .logo::before {
            content: 'A';
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 24px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .title {
            flex-grow: 1;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 0 25px;
            color: #009688;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section-title {
            background: linear-gradient(135deg, #009688, #00bfa5);
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 11px;
            margin: 20px 0 8px 0;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0, 150, 136, 0.2);
        }
        
        .user-data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 5px;
            overflow: hidden;
        }
        
        .user-data-table td {
            border: 1px solid #ddd;
            padding: 8px 10px;
            font-size: 10px;
            vertical-align: middle;
        }
        
        .user-data-table .label {
            background: rgba(255, 255, 255, 0.85);
            font-weight: bold;
            text-align: center;
            width: 15%;
            color: #004d40;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        
        .user-data-table .value {
            background: rgba(255, 255, 255, 0.85);
            width: 35%;
            font-weight: 500;
            color: #333;
        }
        
        .assets-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 5px;
            overflow: hidden;
        }
        
        .assets-table th,
        .assets-table td {
            border: 1px solid #ddd;
            padding: 8px 6px;
            font-size: 10px;
            text-align: center;
            vertical-align: middle;
        }
        
        .assets-table th {
            background: rgba(255, 255, 255, 0.85);
            font-weight: bold;
            color: #004d40;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        
        .assets-table td {
            background: rgba(255, 255, 255, 0.85);
            font-weight: 500;
            color: #333;
        }
        
        .assets-table tbody tr:nth-child(even) {
            background: rgba(255, 255, 255, 0.85);
        }
        
        .assets-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.85);
        }
        
        .signature-section {
            margin-top: 25px;
            border: 2px solid #009688;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 150, 136, 0.15);
            overflow: hidden;
        }
        
        .signature-header {
            background: linear-gradient(135deg, #009688, #00bfa5);
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
        }
        
        .signature-content {
            padding: 20px;
            background: rgba(255, 255, 255, 0.85);
        }
        
        .signature-text {
            font-size: 10px;
            line-height: 1.5;
            margin-bottom: 25px;
            text-align: justify;
            color: #333;
            background: rgba(255, 255, 255, 0.85);
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #009688;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .signature-boxes {
            display: flex;
            justify-content: space-between;
            gap: 30px;
        }
        
        .signature-box {
            flex: 1;
            text-align: center;
            border: 2px solid #009688;
            padding: 15px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.85);
            box-shadow: 0 3px 8px rgba(0, 150, 136, 0.1);
        }
        
        .signature-area {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            border: 1px dashed #009688;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.85);
}
        
        .signature-image {
            max-width: 100%;
            max-height: 60px;
            filter: contrast(1.1);
        }
        .logo-container {
            width: 100px;
            height: auto;
            display: flex;
            align-items: center;
            justify-content: flex-end;
}

        .logo-image {
            max-width: 100px;
            height: auto;
}

        
        .signature-name {
            font-size: 10px;
            font-weight: bold;
            border-top: 2px solid #009688;
            padding-top: 8px;
            color: #009688;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .date-field {
            text-align: right;
            font-size: 10px;
            margin-bottom: 15px;
            color: #666;
            font-weight: 500;
        }
       body::after {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-20deg);
    width: 500px;
    height: 500px;
    background-image: url('http://localhost:3001/public/images/ARIS-A.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    opacity: 0.15;
    z-index: -1;
    pointer-events: none;
}

    </style>
</head>
<body>
    <div class="header">
<div class="logo-container">
  <img src="http://localhost:3001/public/images/ARIS--LOGO.png" class="logo-image" alt="Logo ARIS">
</div>
        <div class="title">FORMATO DE ENTREGA Y DEVOLUCIÓN DE BIENES</div>
    </div>
    
    <div class="date-field">
        <strong>Fecha:</strong> ${date}
    </div>
    
    <div class="section-title">DATOS DE USUARIO</div>
    
    <table class="user-data-table">
        <tr>
            <td class="label">CÓDIGO</td>
            <td class="value">${user.code}</td>
            <td class="label">USUARIO</td>
            <td class="value">${user.name}</td>
        </tr>
        <tr>
            <td class="label">SUBDIVISIÓN</td>
            <td class="value">{{USER_SUBDIVISION}}</td>
            <td class="label">DIVISIÓN</td>
            <td class="value">{{USER_DIVISION}}</td>
        </tr>
        <tr>
            <td class="label">CARGO</td>
            <td class="value">{{USER_POSITION}}</td>
            <td class="label">JEFE</td>
            <td class="value">{{USER_BOSS}}</td>
        </tr>
    </table>
    
    <div class="section-title">ASIGNACIÓN ACTUAL</div>
    
    <table class="assets-table">
        <thead>
            <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Número de Serie</th>
                        <th>Tipo</th>
                        <th>Estado</th>
            </tr>
        </thead>
        <tbody>
                    ${assets.map(asset => `
                        <tr>
                            <td>${asset.id}</td>
                            <td>${asset.name}</td>
                            <td>${asset.otherserial || 'N/A'}</td>
                            <td>${asset.type}</td>
                            <td>${asset.state}</td>
                        </tr>
                    `).join('')}
                </tbody>
    </table>
    
    <div class="signature-section">
        <div class="signature-header">POLÍTICAS SOBRE USO DE EQUIPOS</div>
        <div class="signature-content">
            <div class="signature-text">
                EL TRABAJADOR, deberá informar de manera inmediata cualquier desperfecto o daño que suficieren o bien entregado, con la finalidad de ser alertado a la brevedad posible. Por ningún motivo deberá hacerlo por cuenta propia.
                <br><br>
                EL TRABAJADOR, manifiesta que firma a fin de ser buenas condiciones, comprometiéndose a cargo pago de él si cumplimiento de sus funciones o de responsabilidad por todos los actos que pudieran devenir o resultar por la custodia y uso de los bienes que se le otorgan. Comprometiéndose asimismo a devolverlos cuando se le requieran, en las mismas condiciones en que los recibió, salvo el deterioro por el uso normal de los mismos. Si el trabajador fuere separado del centro de labores se obliga a entregar todos los bienes bajo su responsabilidad, caso de "NO HACERLO".
            </div>
            
            <div class="signature-boxes">
                <div class="signature-box">
                    <div class="signature-area">
                        <img src="${technicianSignature}" class="signature-image" alt="Firma del Técnico" />
                    </div>
                    <div class="signature-name">${technician.name}</div>
                </div>
                <div class="signature-box">
                    <div class="signature-area">
                        <img src="${userSignature}" class="signature-image" alt="Firma del Usuario" />
                    </div>
                    <div class="signature-name">${user.name}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    await browser.close();
    // Save delivery record to database
    localDb.query(
      `INSERT INTO deliveries (technician_id, user_name, user_email, assets_data, 
       technician_signature, user_signature, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        technician.id,
        user.name,
        user.email,
        JSON.stringify(assets),
        technicianSignature,
        userSignature
      ],
      (err, result) => {
        if (err) {
          console.error('Error saving delivery:', err);
        }
      }
    );

    // Send email
    if (user.email && user.email !== 'Sin email') {
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: user.email,
        subject: `Asignación de Bienes - ${user.name}`,
        text: `Buen día estimado/a ${user.name},\n\nPor este medio se le hace entrega del documento de asignación de bienes.\n\nSaludos cordiales,\nÁrea de Soporte TI.`,
        attachments: [{
          filename: `Asignación_Bienes_${user.name}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      };

       await mailService.sendMail(mailOptions);;
    }

   res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="entrega_activos_${user.name}.pdf"`,
    'Content-Length': pdfBuffer.length
});
  res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
};