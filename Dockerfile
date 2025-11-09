# Base image and build-time envs come in as build args so CI can override them.
ARG NEXT_PUBLIC_AWS_COGNITO_POOL_ID
ARG NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL

FROM node:24-alpine AS base                      
WORKDIR /app                         
# re-declare args for this stage           
ARG NEXT_PUBLIC_AWS_COGNITO_POOL_ID             
ARG NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL

# Re-expose the Cognito values so Next.js reads them during `next build`.
ENV NEXT_PUBLIC_AWS_COGNITO_POOL_ID=$NEXT_PUBLIC_AWS_COGNITO_POOL_ID \
    NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=$NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID \
    NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL=$NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL

# dependency-only layer
FROM base AS deps                               
COPY package.json package-lock.json ./          
RUN npm ci                                      

FROM base AS builder                           
COPY --from=deps /app/node_modules ./node_modules
COPY . .                                      
ENV NODE_ENV=production               
# emits static export into /out        
RUN npm run build                             

FROM nginx:alpine AS runner             
# It installs the gettext package (we need its envsubst tool) 
# and makes sure /etc/nginx/templates exists to hold our env-config template.   
RUN apk add --no-cache gettext=0.22.5-r0 && mkdir -p /etc/nginx/templates  
# ship the static site
COPY --from=builder /app/out /usr/share/nginx/html                
# custom nginx rules
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf             
COPY docker/env-config.js.template /etc/nginx/templates/env-config.js.template
# runtime env injector
COPY docker/entrypoint.sh /entrypoint.sh                          
RUN chmod +x /entrypoint.sh
# rewrite env-config.js before nginx
ENTRYPOINT ["/entrypoint.sh"]   
# container listens on 8080               
EXPOSE 8080                                 
# keep nginx in foreground
CMD ["nginx", "-g", "daemon off;"]             
