/**
 * src/swagger.js
 *
 * Builds an OpenAPI spec from @swagger comments in the route files,
 * so Swagger UI can render an interactive testing page at /api-docs.
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GlobeTrotter Travel Assistant API',
      version: '1.0.0',
      description: 'Phase 1: Monolith — CS4122 Cloud Computing & Distributed Systems',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/*.js'],
};

module.exports = swaggerJsdoc(options);
