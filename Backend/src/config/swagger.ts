import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { Express } from "express";

export function setupSwagger(app: Express) {
    const options = {
        definition: {
            openapi: "3.0.0",
            info: {
                title: "Insight API 문서",
                version: "1.0.0",
                description: "홍박사의 Insight 백엔드 API 명세서 (Swagger)",
            },
            servers: [
                {
                    url: "http://localhost:4000/api/v1", 
                    description: "로컬 서버",
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },

        apis: ["./src/app/v1/**/*.ts", "./src/app/**/*.ts"],
    };

    const specs = swaggerJSDoc(options);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

    console.log("📘 Swagger 문서: http://localhost:4000/api-docs");
}
