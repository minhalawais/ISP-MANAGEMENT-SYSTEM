# Deployment Guide: Migrating to Subdomains (nexus & customer)

This guide provides the complete steps to move your application from `mbanet.com.pk` to:
*   **Main App**: `nexus.mbanet.com.pk`
*   **Customer Portal**: `customer.mbanet.com.pk`

## 1. DNS Configuration

**CRITICAL: Where to add these records?**
Since you mentioned the domain is **not showing in Hostinger's Domain section**, it means you are managing DNS **directly at domain.pk** (or wherever you pointed the main domain to your VPS).

**Action:** Log in to your **domain.pk control panel** (where you bought the domain).
Look for **"DNS Management"**, **"Zone Editor"**, or **"Nameservers"**.

*   If you see "Nameservers", ensure they point to where you want to manage DNS.
*   **Most Likely:** You simply need to add the A records **in the same place** where you added the A record for `mbanet.com.pk`.

**Records to Add:**

| Type | Name | Content/Points to | TTL |
|------|------|-------------------|-----|
| A | nexus | 147.93.53.119 | 300 |
| A | customer | 147.93.53.119 | 300 |

> **Verification:** After adding them, these subdomains will point to your VPS just like your main domain does.

## 2. Prepare the Application

Ensure the React application is rebuilt to support the new routing logic.

1.  **Verify Code**: Ensure `src/App.tsx` has the subdomain routing and `src/utils/axiosConfig.ts` uses `/api` as base URL.
2.  **Build**: Run the build command in the project root.
    ```bash
    cd /var/www/html/ISP-MANAGEMENT-SYSTEM
    npm install
    npm run build
    ```

## 3. Nginx Configuration

We will replace your existing configuration to listen on the new subdomains.

**Important**: We will start with a HTTP (Port 80) configuration and use Certbot to automatically upgrade to HTTPS. This prevents SSL errors during setup.

1.  **Edit the default config**:
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```

2.  **Replace EVERYTHING with the following content**:

    ```nginx
    # ----------------------------------------------------------------------
    # 1. Main Application (nexus.mbanet.com.pk)
    # ----------------------------------------------------------------------
    server {
        listen 80;
        server_name nexus.mbanet.com.pk;

        root /var/www/html/ISP-MANAGEMENT-SYSTEM/build;
        index index.html;

        # Serve React App
        location / {
            try_files $uri /index.html;
        }

        # API Proxy (Preserving your specific rewrite rule)
        location /api/ {
            proxy_pass http://127.0.0.1:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;

            # Rewrite /api/foo -> /foo before sending to Flask
            rewrite ^/api(/.*)$ /$1 break;
        }
    }

    # ----------------------------------------------------------------------
    # 2. Customer Portal (customer.mbanet.com.pk)
    # ----------------------------------------------------------------------
    server {
        listen 80;
        server_name customer.mbanet.com.pk;

        root /var/www/html/ISP-MANAGEMENT-SYSTEM/build;
        index index.html;

        # Serve Same React App (App.tsx handles the view)
        location / {
            try_files $uri /index.html;
        }

        # API Proxy (Preserving your specific rewrite rule)
        location /api/ {
            proxy_pass http://127.0.0.1:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;

            # Rewrite /api/foo -> /foo before sending to Flask
            rewrite ^/api(/.*)$ /$1 break;
        }
    }

    # ----------------------------------------------------------------------
    # 3. separate website on (mbanet.com.pk)
    # ----------------------------------------------------------------------
    # You mentioned you will deploy a DIFFERENT website here.
    # You will need to create a separate Nginx config file for it later.
    # Do NOT include a server block for mbanet.com.pk in this file.
    ```

3.  **Save and Exit**: Press `Ctrl+O`, `Enter`, then `Ctrl+X`.

4.  **Test Configuration**:
    ```bash
    sudo nginx -t
    ```
    *If you see "syntax is ok", proceed.*

5.  **Restart Nginx**:
    ```bash
    sudo systemctl restart nginx
    ```

## 4. SSL Certificates (HTTPS)

Now that the site is running on HTTP (80), use Certbot to secure it.

1.  **Run Certbot**:
    ```bash
    sudo certbot --nginx -d nexus.mbanet.com.pk -d customer.mbanet.com.pk
    ```
    *   If asked to redirect HTTP to HTTPS, choose **2 (Redirect)**.

2.  **(Optional) Secure the old domain redirect**:
    If you kept the `mbanet.com.pk` block:
    ```bash
    sudo certbot --nginx -d mbanet.com.pk
    ```

## 5. Verification

1.  Open **[http://nexus.mbanet.com.pk](http://nexus.mbanet.com.pk)** -> Should load the Login/Dashboard.
2.  Open **[http://customer.mbanet.com.pk](http://customer.mbanet.com.pk)** -> Should load the Customer Portal.
