import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold">CareConnect</span>
            </Link>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: November 18, 2024</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Welcome to CareConnect. These Terms of Service (Terms) govern your access to and use of the CareConnect platform, which connects families, case managers, social workers, and discharge planners with licensed 245D care providers in Minnesota.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using CareConnect, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our platform.
            </p>
          </section>

          {/* Platform Description */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Platform Description</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              CareConnect is a marketplace platform that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provides a searchable directory of licensed 245D care providers in Minnesota</li>
              <li>Facilitates connections between individuals seeking care and care providers</li>
              <li>Enables secure communication and booking requests</li>
              <li>Verifies provider licenses and credentials</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Important:</strong> CareConnect is a platform that connects parties but does not provide healthcare services, make placement decisions, or establish care relationships. We are not a healthcare provider, case management service, or insurance entity.
            </p>
          </section>

          {/* User Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Eligibility</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use CareConnect, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Be at least 18 years of age</li>
              <li>Have the legal authority to enter into these Terms</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>For providers: Hold valid Minnesota 245D licensure and required credentials</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts and Responsibilities</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Account Creation</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized access or security breach.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Accurate Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to provide accurate, current, and complete information and to update such information as necessary. Providing false or misleading information may result in account termination.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Account Types</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect offers two account types:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Care Seekers:</strong> Free accounts for families, case managers, social workers, and discharge planners to search and connect with providers</li>
              <li><strong>Care Providers:</strong> Subscription-based accounts for licensed 245D providers ($99.99/month or $139.99/month for premium tier)</li>
            </ul>
          </section>

          {/* Provider Specific Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Provider-Specific Terms</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Verification and Credentials</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Providers must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Maintain valid Minnesota 245D licensure</li>
              <li>Provide accurate business and license information</li>
              <li>Keep capacity and availability information current</li>
              <li>Notify CareConnect of any changes to licensing status</li>
              <li>Comply with all applicable state and federal regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Subscription and Payment</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Provider subscriptions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Are billed monthly in advance</li>
              <li>Automatically renew unless cancelled</li>
              <li>May be cancelled at any time, effective at the end of the current billing period</li>
              <li>Are non-refundable except as required by law</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Listing Accuracy</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Providers are solely responsible for the accuracy of their listings, including services offered, capacity, contact information, and facility details.
            </p>
          </section>

          {/* Prohibited Uses */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the platform for any unlawful purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Attempt to gain unauthorized access to the platform or other users accounts</li>
              <li>Use automated systems (bots, scrapers) without authorization</li>
              <li>Interfere with or disrupt the platform operation</li>
              <li>Upload viruses, malware, or malicious code</li>
              <li>Circumvent security features or access controls</li>
              <li>Use contact information obtained through the platform for unauthorized marketing</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimers and Limitations</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">7.1 Platform As Is</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect is provided as available without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or secure.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.2 No Healthcare Services</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect does not provide healthcare services, medical advice, or case management services. We are a technology platform that facilitates connections. All care relationships, services, and decisions are between the care seeker (or their representative) and the care provider.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.3 Provider Verification</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              While we verify provider licenses, we do not guarantee the quality of care, suitability of placement, or outcomes. Care seekers and their representatives are responsible for conducting their own due diligence, including visiting facilities and reviewing provider credentials.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">7.4 Third-Party Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Provider listings and communications are created by third parties. CareConnect is not responsible for the accuracy, completeness, or quality of third-party content.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>CareConnect shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount paid by you to CareConnect in the twelve months preceding the claim</li>
              <li>We are not liable for any loss or damage arising from care relationships, placements, or services arranged through the platform</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless CareConnect and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the platform, violation of these Terms, or violation of any rights of others.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Intellectual Property Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The CareConnect platform, including its design, features, functionality, and content (excluding user-generated content), is owned by CareConnect and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of content you submit but grant CareConnect a license to use, display, and distribute such content as necessary to provide our services.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of CareConnect is subject to our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. We comply with applicable privacy laws and implement appropriate safeguards to protect your information.
            </p>
          </section>

          {/* HIPAA Compliance */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. HIPAA Compliance</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect facilitates connections but does not access, store, or transmit Protected Health Information (PHI) as defined by HIPAA. Users should not share PHI through our platform. For more information, see our <Link href="/hipaa" className="text-blue-600 hover:underline">HIPAA Compliance Statement</Link>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Care arrangements and any exchange of PHI occur directly between care seekers (or their representatives) and providers outside our platform.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">13.1 Informal Resolution</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have a dispute with CareConnect, please contact us at careconnectmkting@gmail.com to attempt informal resolution.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">13.2 Governing Law</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by the laws of the State of Minnesota, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violate these Terms</li>
              <li>Provide false or misleading information</li>
              <li>Engage in fraudulent activity</li>
              <li>For providers: lose required licenses or credentials</li>
              <li>Fail to pay subscription fees (for providers)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You may terminate your account at any time through your account settings or by contacting us.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. We will notify you of material changes by email or through the platform. Your continued use of CareConnect after changes become effective constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>CareConnect</strong></p>
              <p className="text-gray-700">Email: careconnectmkting@gmail.com</p>
              <p className="text-gray-700">Hours: Monday - Friday, 8AM - 5PM CST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}