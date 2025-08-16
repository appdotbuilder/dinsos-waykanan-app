import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createApplicationInputSchema,
  trackApplicationInputSchema,
  updateApplicationStatusInputSchema,
  uploadDocumentInputSchema,
  addStatusTimelineInputSchema,
  createServiceInputSchema,
  updateServiceInputSchema,
  createFeaturedProgramInputSchema,
  updateFeaturedProgramInputSchema,
  createNewsInputSchema,
  updateNewsInputSchema
} from './schema';

// Import handlers
import { createApplication } from './handlers/create_application';
import { trackApplication } from './handlers/track_application';
import { getApplications } from './handlers/get_applications';
import { updateApplicationStatus } from './handlers/update_application_status';
import { uploadDocument } from './handlers/upload_document';
import { getDocuments } from './handlers/get_documents';
import { addStatusTimeline } from './handlers/add_status_timeline';
import { getStatusTimeline } from './handlers/get_status_timeline';
import { createService } from './handlers/create_service';
import { getServices } from './handlers/get_services';
import { updateService } from './handlers/update_service';
import { deleteService } from './handlers/delete_service';
import { createFeaturedProgram } from './handlers/create_featured_program';
import { getFeaturedPrograms } from './handlers/get_featured_programs';
import { updateFeaturedProgram } from './handlers/update_featured_program';
import { deleteFeaturedProgram } from './handlers/delete_featured_program';
import { createNews } from './handlers/create_news';
import { getNews } from './handlers/get_news';
import { getAnnouncements } from './handlers/get_announcements';
import { updateNews } from './handlers/update_news';
import { deleteNews } from './handlers/delete_news';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Social Assistance Application routes
  createApplication: publicProcedure
    .input(createApplicationInputSchema)
    .mutation(({ input }) => createApplication(input)),

  trackApplication: publicProcedure
    .input(trackApplicationInputSchema)
    .query(({ input }) => trackApplication(input)),

  getApplications: publicProcedure
    .query(() => getApplications()),

  updateApplicationStatus: publicProcedure
    .input(updateApplicationStatusInputSchema)
    .mutation(({ input }) => updateApplicationStatus(input)),

  // Document management routes
  uploadDocument: publicProcedure
    .input(uploadDocumentInputSchema)
    .mutation(({ input }) => uploadDocument(input)),

  getDocuments: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(({ input }) => getDocuments(input.applicationId)),

  // Status timeline routes
  addStatusTimeline: publicProcedure
    .input(addStatusTimelineInputSchema)
    .mutation(({ input }) => addStatusTimeline(input)),

  getStatusTimeline: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(({ input }) => getStatusTimeline(input.applicationId)),

  // Services ("Layanan Kami") routes
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),

  getServices: publicProcedure
    .query(() => getServices()),

  updateService: publicProcedure
    .input(updateServiceInputSchema)
    .mutation(({ input }) => updateService(input)),

  deleteService: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteService(input.id)),

  // Featured Programs ("Program Unggulan") routes
  createFeaturedProgram: publicProcedure
    .input(createFeaturedProgramInputSchema)
    .mutation(({ input }) => createFeaturedProgram(input)),

  getFeaturedPrograms: publicProcedure
    .query(() => getFeaturedPrograms()),

  updateFeaturedProgram: publicProcedure
    .input(updateFeaturedProgramInputSchema)
    .mutation(({ input }) => updateFeaturedProgram(input)),

  deleteFeaturedProgram: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteFeaturedProgram(input.id)),

  // News & Announcements ("Berita & Pengumuman") routes
  createNews: publicProcedure
    .input(createNewsInputSchema)
    .mutation(({ input }) => createNews(input)),

  getNews: publicProcedure
    .query(() => getNews()),

  getAnnouncements: publicProcedure
    .query(() => getAnnouncements()),

  updateNews: publicProcedure
    .input(updateNewsInputSchema)
    .mutation(({ input }) => updateNews(input)),

  deleteNews: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteNews(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();