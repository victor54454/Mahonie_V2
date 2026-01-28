FROM php:8.2-apache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy website files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create bookings directory
RUN mkdir -p /var/www/html/bookings \
    && chown -R www-data:www-data /var/www/html/bookings \
    && chmod -R 777 /var/www/html/bookings

# Add test suite script
RUN chmod +x /var/www/html/test-suite.sh

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
