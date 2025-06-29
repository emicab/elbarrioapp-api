import {Request, Response} from 'express';
import {AuthRequest} from '../../middlewares/isAuthenticated';
import * as BenefitService from './benefit.service';

export const getBenefitsController = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Obtenemos el userId del token (la ruta debe estar protegida)
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        // 2. Obtenemos 'city' y el nuevo 'category' de la query
        const { city, category } = req.query;

        if (!city) {
            return res.status(400).json({ message: 'El parámetro city es requerido.' });
        }

        // 3. Llamamos a la nueva función del servicio pasándole todos los datos
        const benefits = await BenefitService.findBenefitsByCityForUser(
            city as string,
            userId,
            category as string | undefined // 'category' es opcional
        );

        res.status(200).json(benefits);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const generateQrController = async (req : AuthRequest, res : Response) => {
    try {
        const userId = req.user ?. userId;
        const {id: benefitId} = req.params;

        if (! userId) 
            return res.status(403).json({message: 'Usuario no autenticado.'});
        

        const redemption = await BenefitService.generateRedemptionToken(benefitId, userId);
        res.status(201).json({token: redemption.token, expiresAt: redemption.expiresAt});

    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
}

/**
 *  
 * @returns Se obtienen todos los canjes activos para el usuario actual.
 */
export const getActiveRedemptionController = async (req : AuthRequest, res : Response) => {
    try {
        const userId = req.user ?. userId;
        const {id: benefitId} = req.params;

        if (! userId) 
            return res.status(403).json({message: 'Usuario no autenticado.'});
        

        const redemption = await BenefitService.findActiveRedemptionForUser(benefitId, userId);
        res.status(200).json(redemption); // Devuelve el canje si existe, o null si no
    } catch (error : any) {
        res.status(500).json({message: error.message});
    }
};

export const getBenefitByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: benefitId } = req.params;
    const userId = req.user?.userId;

    if (!userId) return res.status(403).json({ message: 'Usuario no autenticado.' });

    const benefitDetails = await BenefitService.findBenefitDetailsForUser(benefitId, userId);
    res.status(200).json(benefitDetails);

  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};