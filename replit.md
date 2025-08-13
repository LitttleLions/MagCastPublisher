# MagCast - Automated Magazine Publishing System

## Overview

MagCast is a comprehensive magazine publishing platform that automates the creation of print-ready PDFs from JSON data. The system processes magazine issues containing multiple articles and images, applies intelligent layout algorithms, and generates high-quality publications through a template-based rendering engine. Built with a modern full-stack architecture, it provides a complete workflow from content ingestion to final PDF output.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and hot reloading
- **UI Library**: Shadcn/UI components built on Radix UI primitives for accessible, customizable interface elements
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for consistent theming
- **State Management**: TanStack Query for server state management, caching, and synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for type safety across the entire stack
- **API Design**: RESTful API structure with clear separation of concerns
- **Middleware**: Custom logging, error handling, and request processing middleware
- **Development**: Hot reloading with Vite integration in development mode

### Database & Data Layer
- **Database**: PostgreSQL with connection pooling via Neon Database serverless driver
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Comprehensive data model covering issues, articles, images, template packs, render jobs, and assets
- **Migrations**: Automated database schema versioning and migration system
- **Validation**: Zod schemas for runtime type checking and API validation

### Core Publishing Engine
- **Layout Intelligence**: Automated article fitting with configurable typography scaling (9.5-10.5pt range)
- **Image Processing**: Focal point-aware image placement with support for hero, inline, and gallery layouts
- **Template System**: Modular template packs with CSS-based layout definitions
- **Column Optimization**: Dynamic 1-3 column layouts based on content analysis
- **Rendering Pipeline**: Multi-stage processing from JSON ingestion to final PDF generation

### File Storage & Asset Management
- **Asset Storage**: Centralized asset management with metadata tracking (DPI, dimensions, focal points)
- **Image Handling**: Support for multiple image roles and automatic optimization
- **PDF Generation**: Integration-ready architecture for PDF rendering engines
- **File Organization**: Structured asset organization with version control capabilities

### Process Management
- **Job Queue**: Asynchronous render job processing with status tracking and progress monitoring
- **Health Monitoring**: System health checks for render engines, asset storage, webhooks, and queue status
- **Error Handling**: Comprehensive error tracking and recovery mechanisms
- **Logging**: Structured logging for debugging and performance monitoring

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling and connection pooling
- **Replit Platform**: Development environment with integrated deployment and runtime error monitoring

### UI Components & Styling
- **Radix UI**: Headless component primitives for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Consistent icon system throughout the application

### Development Tools
- **Vite**: Build tool and development server with plugin ecosystem
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Static type checking and enhanced developer experience

### Data & Forms
- **TanStack Query**: Server state management with intelligent caching
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation for TypeScript with runtime type checking
- **Drizzle Kit**: Database toolkit for migrations and schema management

### Planned Integrations
- **PDF Rendering Engine**: Prince XML or similar for high-quality PDF generation
- **Image Processing**: Sharp or similar for image optimization and transformation
- **File Storage**: AWS S3 or similar for scalable asset storage
- **Webhook System**: For real-time integration with external content management systems