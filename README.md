# CNC Logistics Admin Panel

A modern, responsive admin dashboard for CNC Logistics built with Next.js, TypeScript, Tailwind CSS, and Material-UI.

## 🚀 Features

### Authentication
- **Login System**: Secure login with email/password
- **Password Recovery**: Reset password functionality
- **Role-based Access**: 4 user roles (Admin, Manager, User, Trabajador)

### Dashboard Modules
1. **General Dashboard**: KPIs, statistics, and overview cards
2. **Carga Management**: Track shipments with status updates
3. **Contenedor Module**: Container management with filtering and sorting
4. **Gestión Carga**: Advanced cargo management with status tabs
5. **Account Management**: User profiles, company info, and permissions

### Design Features
- **Responsive Design**: Works seamlessly on desktop and mobile
- **CNC Brand Colors**: Custom color palette matching CNC Logistics branding
- **Modern UI/UX**: Clean, intuitive interface with Material-UI components
- **Dark Sidebar**: Professional look with role-based navigation

## 🎨 Color Palette

- **Primary Red**: #E30613
- **Secondary Red**: #FF3B2E
- **Neutral Colors**: Various grays for text and backgrounds
- **System States**: Success (#28A745), Warning (#FFC107), Error (#DC3545)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + Material-UI (MUI)
- **Icons**: Material-UI Icons + Lucide React
- **Data Grid**: MUI X Data Grid
- **State Management**: React Hooks
- **Image Optimization**: Next.js Image component

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CNCLOGIST-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Credentials

Use these credentials to test the system:
- **Email**: admin@cnclogistics.com
- **Password**: admin123

## 📱 User Roles & Permissions

### Admin
- Full system access
- User management
- Company profile management
- All cargo and container operations

### Manager
- Dashboard access
- Cargo and container management
- Company profile access
- Limited user permissions

### User
- Dashboard viewing
- Basic cargo operations
- Personal profile management

### Trabajador
- Limited dashboard access
- Basic cargo viewing
- Personal profile only

## 📊 Key Features by Module

### 1. General Dashboard
- **Statistics Cards**: Total cargos, active containers, deliveries
- **Recent Activity**: Latest cargo updates and container arrivals
- **Charts Section**: Weekly performance summary (placeholder)

### 2. Carga Management
- **CRUD Operations**: Add, edit, delete cargo entries
- **Status Tracking**: En tránsito, Arribo en destino, Listo para entrega, Entregado
- **Transport Types**: Maritime (Marino) and Air (Aéreo)
- **Data Grid**: Sortable, filterable table with pagination

### 3. Contenedor Module
- **Container Tracking**: BL numbers, ETA dates, shipping lines
- **Status Management**: En tránsito, Arribado, Despachado
- **Advanced Filtering**: Search by BL, filter by shipping line
- **Export Functionality**: Data export capabilities

### 4. Gestión Carga
- **Tabbed Interface**: Organize by status (En tránsito, Arribo PTY, Listo para Entrega)
- **Action Buttons**: View details, close cargo operations
- **Location Tracking**: Current location and ETA information
- **Status History**: Track cargo movement history

### 5. Account Management

#### Personal Profile
- **User Information**: Name, email, phone, position
- **Security Settings**: Password change, 2FA setup
- **Notification Preferences**: Email and SMS alerts
- **Account Actions**: Data download, account deactivation

#### Company Profile
- **Corporate Info**: Company name, RUC, address
- **Business Details**: Industry, employees, establishment year
- **Legal Information**: Licenses and certifications
- **Business Statistics**: Performance metrics

#### User Permissions
- **User Management**: Add, edit, delete users
- **Role Assignment**: Assign roles and permissions
- **Permission Matrix**: Granular permission control
- **Account Status**: Activate/deactivate users

## 🎯 Future Enhancements

- **Database Integration**: Replace mock data with Prisma ORM
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Charts**: Interactive charts and analytics
- **File Management**: Document upload and management
- **Notifications**: Real-time notification system
- **Multi-language**: Spanish/English language support
- **Mobile App**: React Native companion app
- **API Integration**: External logistics APIs
- **Audit Logs**: Complete user activity tracking
- **Advanced Reporting**: Custom report generation

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   │   ├── carga/        # Cargo management
│   │   ├── contenedor/   # Container management
│   │   ├── gestion-carga/# Advanced cargo management
│   │   └── mi-cuenta/    # Account management
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Login page
├── components/           # Reusable components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components
│   └── providers/       # Context providers
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Key Components
- **DashboardLayout**: Main layout with sidebar and navigation
- **LoginPage**: Authentication interface
- **ThemeProvider**: Material-UI theme configuration
- **DataGrid**: Reusable table components

## 🚢 Maritime Business Focus

This system is specifically designed for logistics companies handling:
- **Container Shipping**: International freight containers
- **Air Cargo**: Air freight operations
- **Port Operations**: Terminal and warehouse management
- **Supply Chain**: End-to-end logistics tracking
- **Customs Management**: Documentation and compliance

## 📋 Mock Data

The system includes comprehensive mock data for testing:
- **5+ Sample Users** with different roles
- **Sample Cargo Entries** with various statuses
- **Container Records** with shipping lines
- **Company Information** based on JUNALY SOLUTIONS SL
- **Statistics and KPIs** for dashboard demonstration

## 🔒 Security Features

- **Authentication**: Email/password login system
- **Role-based Access Control**: Different permissions per role
- **Session Management**: Local storage token handling
- **Input Validation**: Form validation and error handling
- **Secure Routes**: Protected dashboard routes

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Perfect tablet experience
- **Desktop Optimized**: Full desktop functionality
- **Collapsible Sidebar**: Mobile-friendly navigation
- **Touch-friendly**: Large buttons and touch targets

## 🚀 Production Deployment (Ubuntu Server)

### Prerequisites
- Ubuntu Server 20.04 LTS or higher
- Domain name configured
- Root or sudo access

### Step 1: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential
```

### Step 2: Install Node.js and npm

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE cnclogistics;
CREATE USER cnclogistics_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cnclogistics TO cnclogistics_user;
\c cnclogistics
GRANT ALL ON SCHEMA public TO cnclogistics_user;
EOF
```

### Step 4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Step 5: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/cnclogistics
sudo chown $USER:$USER /var/www/cnclogistics

# Clone repository
cd /var/www/cnclogistics
git clone <your-repository-url> .

# Install dependencies
npm install

# Install Prisma CLI globally (optional)
sudo npm install -g prisma
```

### Step 6: Environment Configuration

```bash
# Create production environment file
nano .env.production

# Add the following variables:
DATABASE_URL="postgresql://cnclogistics_user:your_secure_password@localhost:5432/cnclogistics"
NEXTAUTH_URL="https://app.cnclogist.com"
NEXTAUTH_SECRET="generate_a_secure_random_string_here"
NODE_ENV="production"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 7: Database Migration

```bash
# Run Prisma migrations
npx prisma generate
npx prisma migrate dev --name init
npx prisma migrate deploy

# (Optional) Seed database with initial data
npx prisma db seed
```

### Step 8: Build Application

```bash
# Build Next.js application
npm install
npm run build

# Test the build
npm run start
```

### Step 9: Configure PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'cnclogistics',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/cnclogistics',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/cnclogistics/error.log',
    out_file: '/var/log/cnclogistics/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
```

```bash
# Create log directory
sudo mkdir -p /var/log/cnclogistics
sudo chown $USER:$USER /var/log/cnclogistics

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Monitor application
pm2 monit
```

### Step 10: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cnclogistics
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name app.cnclogist.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.cnclogist.com;

    # SSL Configuration (will be set up by Certbot)
    ssl_certificate /etc/letsencrypt/live/app.cnclogist.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.cnclogist.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public files
    location /public {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cnclogistics /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 11: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate for subdomain
sudo certbot --nginx -d app.cnclogist.com

# Test automatic renewal
sudo certbot renew --dry-run
```

**Important:** Before running Certbot, make sure your DNS A record is configured:
```
Type: A
Name: app
Value: YOUR_SERVER_IP
TTL: 3600
```

You can verify DNS propagation:
```bash
dig app.cnclogist.com
# or
nslookup app.cnclogist.com
```

### Step 12: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check firewall status
sudo ufw status
```

### Step 13: Monitoring and Maintenance

```bash
# View application logs
pm2 logs cnclogistics

# Monitor application status
pm2 status

# Restart application
pm2 restart cnclogistics

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor system resources
htop
```

### Step 14: Automated Backups (Optional)

```bash
# Create backup script
sudo nano /usr/local/bin/backup-cnclogistics.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cnclogistics"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump cnclogistics | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www/cnclogistics .

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-cnclogistics.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add this line:
# 0 2 * * * /usr/local/bin/backup-cnclogistics.sh >> /var/log/backup.log 2>&1
```

### Step 15: Update and Deployment

```bash
# Create deployment script
nano /var/www/cnclogistics/deploy.sh
```

Add the following:

```bash
#!/bin/bash
echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Build application
npm run build

# Restart PM2
pm2 restart cnclogistics

echo "✅ Deployment completed successfully!"
```

```bash
# Make script executable
chmod +x /var/www/cnclogistics/deploy.sh

# Run deployment
./deploy.sh
```

### Useful Commands

```bash
# Check application status
pm2 status

# View logs in real-time
pm2 logs cnclogistics --lines 100

# Restart application
pm2 restart cnclogistics

# Stop application
pm2 stop cnclogistics

# Monitor resources
pm2 monit

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx (without downtime)
sudo nginx -s reload

# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql -d cnclogistics
```

### Troubleshooting

**Application won't start:**
```bash
# Check PM2 logs
pm2 logs cnclogistics --err

# Check environment variables
pm2 show cnclogistics
```

**Database connection errors:**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check database connection
sudo -u postgres psql -d cnclogistics -c "SELECT 1"
```

**Nginx errors:**
```bash
# Test Nginx configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

**Port already in use:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure fail2ban:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Use strong passwords**
4. **Regularly backup database and files**
5. **Monitor logs for suspicious activity**
6. **Keep Node.js and dependencies updated**
7. **Use environment variables for sensitive data**

---

**Built with ❤️ for CNC Logistics by the development team**

For questions or support, contact the development team.