package com.travelease.service;

import com.travelease.entity.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${travelease.email.api-key:}")
    private String apiKey;

    @Value("${travelease.email.from-address:onboarding@resend.dev}")
    private String fromAddress;

    private final RestClient restClient;

    public EmailService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .build();
    }

    public boolean sendBookingConfirmation(Booking booking) {
        if (booking == null) {
            return false;
        }

        String recipientEmail = booking.getCustomerEmail();
        String subject = "Booking Confirmed - TravelEase (" + booking.getTourPackage().getTitle() + ")";
        String htmlContent = buildBookingReceiptHtml(booking);

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("placeholder")) {
            log.info("Email API key not configured. Simulated booking confirmation receipt for booking #{} sent to {}",
                    booking.getId(), recipientEmail);
            return false;
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("from", fromAddress);
            body.put("to", List.of(recipientEmail));
            body.put("subject", subject);
            body.put("html", htmlContent);

            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Booking confirmation email successfully dispatched to {} for booking #{}", recipientEmail, booking.getId());
            return true;
        } catch (Exception e) {
            log.warn("Failed to dispatch booking confirmation email to {}: {}", recipientEmail, e.getMessage());
            return false;
        }
    }

    public boolean sendPasswordResetEmail(String toEmail, String resetUrl) {
        String subject = "Reset Your Password - TravelEase";
        String htmlContent = buildPasswordResetHtml(resetUrl);

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("placeholder")) {
            // Strictly avoid logging sensitive tokens or complete URLs to console logs
            log.info("Email API key not configured. Simulated password reset email for recipient {}", toEmail);
            return false;
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("from", fromAddress);
            body.put("to", List.of(toEmail));
            body.put("subject", subject);
            body.put("html", htmlContent);

            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Password reset email successfully dispatched to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Failed to dispatch password reset email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String buildBookingReceiptHtml(Booking booking) {
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        String formattedPrice = currencyFormat.format(booking.getTotalPrice());
        String travelDate = booking.getTravelStartDate() != null
                ? booking.getTravelStartDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"))
                : "TBD";

        return "<!DOCTYPE html>"
                + "<html><head><meta charset='utf-8'><title>Booking Confirmation</title></head>"
                + "<body style=\"margin:0;padding:24px;background-color:#0f172a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,0.5);\">"
                + "  <div style=\"background:linear-gradient(135deg, #0d9488 0%, #0f766e 100%);padding:28px;text-align:center;\">"
                + "    <h1 style=\"margin:0;color:#ffffff;font-size:26px;letter-spacing:1px;font-weight:700;\">TravelEase</h1>"
                + "    <p style=\"margin:8px 0 0 0;color:#ccfbf1;font-size:14px;letter-spacing:0.5px;\">CONFIRMED BOOKING RECEIPT</p>"
                + "  </div>"
                + "  <div style=\"padding:28px;\">"
                + "    <div style=\"text-align:center;margin-bottom:24px;\">"
                + "      <span style=\"display:inline-block;padding:6px 16px;background-color:rgba(16,185,129,0.15);color:#34d399;border:1px solid #059669;border-radius:9999px;font-size:13px;font-weight:600;\">"
                + "        &#10003; PAYMENT VERIFIED &amp; CONFIRMED"
                + "      </span>"
                + "    </div>"
                + "    <p style=\"font-size:15px;line-height:1.6;margin:0 0 20px 0;color:#f1f5f9;\">"
                + "      Dear <strong>" + escapeHtml(booking.getCustomerName()) + "</strong>,<br/>"
                + "      Thank you for choosing TravelEase. Your booking has been confirmed and payment was successfully processed."
                + "    </p>"
                + "    <table style=\"width:100%;border-collapse:collapse;margin:20px 0;background:#0f172a;border-radius:8px;overflow:hidden;\">"
                + "      <tr><td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;\">Booking ID</td>"
                + "          <td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#f1f5f9;font-weight:600;font-size:13px;text-align:right;\">#" + booking.getId() + "</td></tr>"
                + "      <tr><td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;\">Package</td>"
                + "          <td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#f1f5f9;font-weight:600;font-size:13px;text-align:right;\">" + escapeHtml(booking.getTourPackage().getTitle()) + "</td></tr>"
                + "      <tr><td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;\">Travel Date</td>"
                + "          <td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#f1f5f9;font-weight:600;font-size:13px;text-align:right;\">" + travelDate + "</td></tr>"
                + "      <tr><td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;\">Travelers</td>"
                + "          <td style=\"padding:12px 16px;border-bottom:1px solid #1e293b;color:#f1f5f9;font-weight:600;font-size:13px;text-align:right;\">" + booking.getTravelers() + " Person(s)</td></tr>"
                + "      <tr><td style=\"padding:14px 16px;color:#cbd5e1;font-size:15px;font-weight:700;\">Total Paid</td>"
                + "          <td style=\"padding:14px 16px;color:#2dd4bf;font-weight:700;font-size:17px;text-align:right;\">" + formattedPrice + "</td></tr>"
                + "    </table>"
                + "    <p style=\"font-size:13px;color:#94a3b8;line-height:1.5;\">"
                + "      For any questions or changes, reply to this email or reach our support desk anytime."
                + "    </p>"
                + "  </div>"
                + "  <div style=\"background:#0f172a;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #334155;\">"
                + "    &copy; TravelEase &bull; Happy Travels"
                + "  </div>"
                + "</div></body></html>";
    }

    private String buildPasswordResetHtml(String resetUrl) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='utf-8'><title>Reset Password</title></head>"
                + "<body style=\"margin:0;padding:24px;background-color:#0f172a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;\">"
                + "<div style=\"max-width:550px;margin:0 auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,0.5);\">"
                + "  <div style=\"background:linear-gradient(135deg, #0d9488 0%, #0f766e 100%);padding:24px;text-align:center;\">"
                + "    <h1 style=\"margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;\">TravelEase</h1>"
                + "    <p style=\"margin:6px 0 0 0;color:#ccfbf1;font-size:13px;\">Password Reset Request</p>"
                + "  </div>"
                + "  <div style=\"padding:28px;\">"
                + "    <p style=\"font-size:15px;line-height:1.6;color:#f1f5f9;margin:0 0 20px 0;\">"
                + "      We received a request to reset your TravelEase account password. Click the button below to choose a new password:"
                + "    </p>"
                + "    <div style=\"text-align:center;margin:30px 0;\">"
                + "      <a href=\"" + escapeHtml(resetUrl) + "\" style=\"display:inline-block;padding:12px 28px;background:linear-gradient(135deg, #0d9488 0%, #0f766e 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(13,148,136,0.4);\">"
                + "        Reset Password"
                + "      </a>"
                + "    </div>"
                + "    <p style=\"font-size:13px;line-height:1.5;color:#94a3b8;\">"
                + "      This link will expire in <strong>15 minutes</strong> and can only be used once.<br/>"
                + "      If you did not request a password reset, please ignore this email. Your account remains secure."
                + "    </p>"
                + "  </div>"
                + "  <div style=\"background:#0f172a;padding:14px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #334155;\">"
                + "    &copy; TravelEase Security"
                + "  </div>"
                + "</div></body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
