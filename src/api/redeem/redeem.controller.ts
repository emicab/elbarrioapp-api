import { Request, Response } from 'express';
import * as RedeemService from './redeem.service';
import { io } from '../../socket'; // Asegúrate de importar 'io'
import { generateHtmlResponse } from '../../utils/generateHTMLResponse';

export const showRedeemPageController = async (req: Request, res: Response) => {
    const { token } = req.params;
    const redemption = await RedeemService.validateToken(token);

    if (!redemption) {
        const html = generateHtmlResponse({
            title: 'QR Inválido',
            message: 'Este código QR no es válido, ya fue utilizado o ha expirado.',
            status: 'error',
        });
        return res.status(404).send(html);
    }

    const formHtml = `
        <form action="/api/redeem/${token}" method="POST">
            <button type="submit">Marcar como Canjeado</button>
        </form>
    `;

    const messageHtml = `
        De <strong>${redemption.benefit.company.name}</strong> para el usuario <strong>${redemption.user.firstName} ${redemption.user.lastName}</strong>.<br><br>
        <strong>Beneficio:</strong> ${redemption.benefit.title}
    `;

    const html = generateHtmlResponse({
        title: 'Confirmar Beneficio',
        message: messageHtml,
        status: 'info',
        form: formHtml
    });
    res.status(200).send(html);
    
};

export const redeemTokenController = async (req: Request, res: Response) => {
  const { token } = req.params;
  const redemption = await RedeemService.validateToken(token);

  if (!redemption) {
    const html = generateHtmlResponse({
      title: 'Error',
      message: 'Este código QR ya no es válido, fue utilizado o ha expirado.',
      status: 'error',
    });
    return res.status(404).send(html);
  }

  await RedeemService.markTokenAsRedeemed(token, redemption.claimedBenefitId);

  // --- ¡AQUÍ ESTÁ LA LÓGICA CLAVE! ---
  // Emitimos un evento a la "sala" privada del usuario
  io.to(redemption.userId).emit('redemption:success', {
    message: `Tu beneficio "${redemption.benefit.title}" ha sido canjeado.`,
    benefitId: redemption.benefitId,
    claimedId: redemption.claimedBenefitId
  });

  const html = generateHtmlResponse({
    title: '¡Éxito!',
    message: 'El beneficio ha sido canjeado correctamente.',
    status: 'success',
  });
  res.status(200).send(html);
};