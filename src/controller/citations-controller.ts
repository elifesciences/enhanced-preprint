import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

export const citationsController = () => {
  const downloadBibtex = async (req: Request, res: Response, next: NextFunction) => {
    const {
      publisherId,
      articleId,
    } = req.params;
    const doi = `${publisherId}/${articleId}`;

    try {
      const extReq = await axios.get(
        `https://api.crossref.org/works/${doi}/transform/application/x-bibtex`,
      );

      const bibtex = decodeURI(extReq.data);

      if (bibtex) {
        res.set({ 'Content-Disposition': 'attachment; filename=citation.bib' });
        res.send(bibtex);
      } else {
        res.status(400);
      }
    } catch (err) {
      next(err);
    }
  };

  return {
    downloadBibtex,
  };
};