import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: November 18, 2025</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              CareConnect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform that connects families, case managers, and social workers with licensed 245D care providers in Minnesota.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Information You Provide</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you use CareConnect, you may provide us with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Name, email address, phone number, and account credentials</li>
              <li><strong>Profile Information:</strong> Professional role (case manager, social worker, discharge planner, family member), organization affiliation</li>
              <li><strong>Care Inquiry Information:</strong> Service needs, waiver types, location preferences, and service requirements</li>
              <li><strong>Communication Data:</strong> Messages sent through our secure messaging system, booking requests, and support inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Information from Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Licensed care providers on our platform provide:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Business information, license numbers, and verification documents</li>
              <li>Service offerings, capacity information, and facility details</li>
              <li>Contact information and availability</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We automatically collect certain information when you access our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Device information, browser type, and IP address</li>
              <li>Usage data, including pages visited and features used</li>
              <li>Location data (with your permission) for provider searches</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide and maintain our platform services</li>
              <li>Connect families and care coordinators with appropriate care providers</li>
              <li>Facilitate secure communication between parties</li>
              <li>Process bookings and service requests</li>
              <li>Verify provider credentials and maintain quality standards</li>
              <li>Send service-related notifications and updates</li>
              <li>Improve our platform and develop new features</li>
              <li>Comply with legal obligations and industry regulations</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">4.1 With Your Consent</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We share your contact information and service needs with care providers only when you initiate a booking request or inquiry. You control what information you share through our platform.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share information with trusted third-party service providers who assist in operating our platform, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Hosting and infrastructure providers</li>
              <li>Payment processors (for provider subscriptions)</li>
              <li>Email and communication services</li>
              <li>Analytics and performance monitoring tools</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose information when required by law, such as in response to court orders, legal processes, or to protect rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.4 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We implement appropriate technical and organizational security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and updates</li>
              <li>Limited access to personal information by authorized personnel only</li>
              <li>Secure backup and disaster recovery procedures</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correct:</strong> Update or correct inaccurate information through your account settings</li>
              <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
              <li><strong>Object:</strong> Object to certain uses of your information</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where consent was the basis</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at careconnectmkting@gmail.com.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete or anonymize your personal information within 90 days, except where retention is required by law or for legitimate business purposes.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              CareConnect is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          {/* California Privacy Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. California Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us:
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