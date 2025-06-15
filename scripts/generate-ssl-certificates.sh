#!/bin/bash
# Generate SSL certificates for ViralHub

echo "🔐 SSL Certificate Generator for ViralHub"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create SSL directory if it doesn't exist
SSL_DIR="./ssl"
mkdir -p "$SSL_DIR"

# Function to generate self-signed certificate
generate_self_signed() {
    echo -e "${BLUE}Generating self-signed certificate for development/testing...${NC}"
    echo ""
    
    # Certificate details
    COUNTRY="US"
    STATE="California"
    CITY="San Francisco"
    ORGANIZATION="ViralHub Dev"
    UNIT="Development"
    COMMON_NAME="${1:-localhost}"
    
    # Generate private key
    echo "1. Generating private key..."
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate signing request
    echo "2. Creating certificate signing request..."
    openssl req -new -key "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/csr.pem" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$UNIT/CN=$COMMON_NAME"
    
    # Generate self-signed certificate (valid for 365 days)
    echo "3. Generating self-signed certificate..."
    openssl x509 -req -days 365 \
        -in "$SSL_DIR/csr.pem" \
        -signkey "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem"
    
    # Create a combined certificate file
    echo "4. Creating combined certificate file..."
    cat "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem" > "$SSL_DIR/combined.pem"
    
    # Generate DH parameters for enhanced security
    echo "5. Generating Diffie-Hellman parameters (this may take a while)..."
    openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
    
    # Clean up CSR
    rm -f "$SSL_DIR/csr.pem"
    
    echo ""
    echo -e "${GREEN}✅ Self-signed certificate generated successfully!${NC}"
    echo ""
    echo "Certificate files:"
    echo "  - Private Key: $SSL_DIR/key.pem"
    echo "  - Certificate: $SSL_DIR/cert.pem"
    echo "  - Combined: $SSL_DIR/combined.pem"
    echo "  - DH Params: $SSL_DIR/dhparam.pem"
}

# Function to generate Let's Encrypt certificate
generate_lets_encrypt() {
    local DOMAIN=$1
    local EMAIL=$2
    
    echo -e "${BLUE}Generating Let's Encrypt certificate for production...${NC}"
    echo ""
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo -e "${RED}❌ Certbot is not installed!${NC}"
        echo ""
        echo "To install certbot:"
        echo "  Ubuntu/Debian: sudo apt-get install certbot"
        echo "  CentOS/RHEL: sudo yum install certbot"
        echo "  macOS: brew install certbot"
        return 1
    fi
    
    # Generate certificate
    echo "Requesting certificate from Let's Encrypt..."
    sudo certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN" \
        --cert-path "$SSL_DIR/cert.pem" \
        --key-path "$SSL_DIR/key.pem" \
        --fullchain-path "$SSL_DIR/fullchain.pem"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Let's Encrypt certificate generated successfully!${NC}"
        
        # Set up auto-renewal
        echo ""
        echo "Setting up auto-renewal..."
        (crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet --post-hook 'docker compose restart nginx'") | crontab -
        echo -e "${GREEN}✅ Auto-renewal configured${NC}"
    else
        echo -e "${RED}❌ Failed to generate Let's Encrypt certificate${NC}"
        return 1
    fi
}

# Function to import existing certificates
import_existing() {
    echo -e "${BLUE}Importing existing SSL certificates...${NC}"
    echo ""
    
    # Check for required files
    local CERT_FILE=$1
    local KEY_FILE=$2
    
    if [ ! -f "$CERT_FILE" ]; then
        echo -e "${RED}❌ Certificate file not found: $CERT_FILE${NC}"
        return 1
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
        echo -e "${RED}❌ Private key file not found: $KEY_FILE${NC}"
        return 1
    fi
    
    # Copy certificates
    echo "Copying certificate files..."
    cp "$CERT_FILE" "$SSL_DIR/cert.pem"
    cp "$KEY_FILE" "$SSL_DIR/key.pem"
    
    # Create combined file
    cat "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem" > "$SSL_DIR/combined.pem"
    
    # Set permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 644 "$SSL_DIR/combined.pem"
    
    echo ""
    echo -e "${GREEN}✅ Certificates imported successfully!${NC}"
}

# Function to verify certificates
verify_certificates() {
    echo ""
    echo -e "${BLUE}Verifying SSL certificates...${NC}"
    echo ""
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        echo -e "${RED}❌ Certificate files not found!${NC}"
        return 1
    fi
    
    # Check certificate validity
    echo "Certificate information:"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -subject -dates
    
    # Verify certificate and key match
    echo ""
    echo "Verifying certificate and key match..."
    CERT_MD5=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    KEY_MD5=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [ "$CERT_MD5" == "$KEY_MD5" ]; then
        echo -e "${GREEN}✅ Certificate and key match!${NC}"
    else
        echo -e "${RED}❌ Certificate and key do not match!${NC}"
        return 1
    fi
    
    # Check expiration
    echo ""
    echo "Checking certificate expiration..."
    openssl x509 -checkend 86400 -noout -in "$SSL_DIR/cert.pem"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Certificate is valid for at least 24 hours${NC}"
    else
        echo -e "${YELLOW}⚠️  Certificate expires within 24 hours!${NC}"
    fi
}

# Main menu
echo "Select certificate generation method:"
echo ""
echo "1) Generate self-signed certificate (development/testing)"
echo "2) Generate Let's Encrypt certificate (production)"
echo "3) Import existing certificates"
echo "4) Verify existing certificates"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        read -p "Enter domain name (default: localhost): " DOMAIN
        DOMAIN=${DOMAIN:-localhost}
        generate_self_signed "$DOMAIN"
        verify_certificates
        ;;
    2)
        echo ""
        read -p "Enter your domain name: " DOMAIN
        if [ -z "$DOMAIN" ]; then
            echo -e "${RED}❌ Domain name is required!${NC}"
            exit 1
        fi
        read -p "Enter your email address: " EMAIL
        if [ -z "$EMAIL" ]; then
            echo -e "${RED}❌ Email address is required!${NC}"
            exit 1
        fi
        generate_lets_encrypt "$DOMAIN" "$EMAIL"
        verify_certificates
        ;;
    3)
        echo ""
        read -p "Enter path to certificate file: " CERT_FILE
        read -p "Enter path to private key file: " KEY_FILE
        import_existing "$CERT_FILE" "$KEY_FILE"
        verify_certificates
        ;;
    4)
        verify_certificates
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update nginx.conf with your domain name"
echo "2. Update .env with your domain:"
echo "   WEBHOOK_URL=https://your-domain.com"
echo "   N8N_HOST=your-domain.com"
echo ""
echo "3. Start the production stack:"
echo "   docker compose -f docker-compose.yml -f docker-compose.production.yml up -d"
echo ""
echo "4. For production certificates, ensure:"
echo "   - Port 443 is open in your firewall"
echo "   - DNS A record points to your server IP"
echo "   - No other service is using port 443"