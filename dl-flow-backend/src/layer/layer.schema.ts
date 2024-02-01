import { z } from 'zod';

export const GetLayerInfoSchema = z.object({
  id: z.string(),
  layer_name: z.string()
});

export const GetLayerListSchema = z.object({});