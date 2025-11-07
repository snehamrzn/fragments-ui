FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app

# Public env vars required during the static Next.js build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AWS_COGNITO_POOL_ID
ARG NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_AWS_COGNITO_POOL_ID=$NEXT_PUBLIC_AWS_COGNITO_POOL_ID \
    NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=$NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID \
    NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL=$NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80

