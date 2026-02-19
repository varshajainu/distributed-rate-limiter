# Step 1: Use a lightweight Nginx image
FROM nginx:alpine

# Step 2: Copy your Angular 'dist' folder to the Nginx html folder
# Note: You must run 'ng build' in your Angular project first!
#COPY dist/security-dashboard/browser/dashboard /usr/share/nginx/html
COPY **/index.html /usr/share/nginx/html/
# Step 3: Copy a custom Nginx config if needed (optional)
# For now, we use the default Nginx port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]