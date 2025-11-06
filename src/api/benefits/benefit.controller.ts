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
        // --- MODIFICADO: ahora es claimedId en lugar de id ---
        const { claimedId } = req.params;

        if (! userId) 
            return res.status(403).json({message: 'Usuario no autenticado.'});
        
        // --- MODIFICADO: Pasamos el claimedId al servicio ---
        const redemption = await BenefitService.generateRedemptionToken(claimedId, userId);
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

// --- NUEVO CONTROLADOR ---
export const claimBenefitController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id: benefitId } = req.params;

        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        await BenefitService.claimBenefitForUser(benefitId, userId);
        res.status(200).json({ success: true, message: 'Beneficio reclamado con éxito.' });

    } catch (error: any) {
        // Devolvemos el mensaje de error específico del servicio
        res.status(400).json({ message: error.message });
    }
};

// --- NUEVO CONTROLADOR ---
export const getMyClaimedBenefitsController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }
        
        const claimedBenefits = await BenefitService.findClaimedBenefitsForUser(userId);
        res.status(200).json(claimedBenefits);

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- NUEVO CONTROLADOR ---
export const getClaimedBenefitByIdController = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id: claimedId } = req.params;

        if (!userId) {
            return res.status(403).json({ message: 'Usuario no autenticado.' });
        }

        const claimedBenefit = await BenefitService.findClaimedBenefitById(claimedId, userId);
        res.status(200).json(claimedBenefit);

    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};
