import Link from 'next/link'

export default function HIPAACompliancePage() {
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
        <h1 className="text-4xl font-bold mb-4">HIPAA Compliance Statement</h1>
        <p className="text-gray-600 mb-8">Last Updated: November 18, 2025</p>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect is committed to protecting the privacy and security of health information. This document explains our position regarding the Health Insurance Portability and Accountability Act (HIPAA) and how we handle sensitive information on our platform.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
              <p className="text-gray-800 font-semibold mb-2">Important Notice:</p>
              <p className="text-gray-700">
                CareConnect is a technology platform that facilitates connections between families, case managers, and licensed care providers. We do not provide healthcare services, and we are not a Business Associate or Covered Entity under HIPAA.
              </p>
            </div>
          </section>

          {/* HIPAA Applicability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. HIPAA Applicability to CareConnect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Not a Covered Entity</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect is not a Covered Entity under HIPAA. Covered Entities include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Healthcare providers who transmit health information electronically</li>
              <li>Health plans</li>
              <li>Healthcare clearinghouses</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              CareConnect operates as a marketplace platform that connects parties but does not provide healthcare services, process claims, or transmit Protected Health Information (PHI) on behalf of covered entities.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Not a Business Associate</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect is not a Business Associate under HIPAA because:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>We do not create, receive, maintain, or transmit PHI on behalf of a covered entity</li>
              <li>We do not have access to medical records, treatment information, or health status data</li>
              <li>We do not perform services that involve the use or disclosure of PHI</li>
            </ul>
          </section>

          {/* Platform Function */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How CareConnect Functions</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Connection Facilitation</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect serves as a directory and connection platform where:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Families, case managers, social workers, and discharge planners can search for licensed 245D care providers</li>
              <li>Care providers maintain their business profiles and availability</li>
              <li>Initial contact and booking requests can be made through our secure messaging system</li>
              <li>Parties are connected for further discussion outside the platform</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Information We Handle</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The information processed through CareConnect includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Contact Information:</strong> Names, email addresses, phone numbers</li>
              <li><strong>Service Needs:</strong> General service type requirements (e.g., FRS services, CADI waiver)</li>
              <li><strong>Location Preferences:</strong> City, zip code, distance preferences</li>
              <li><strong>Provider Information:</strong> Business details, license numbers, capacity</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              This information does not constitute PHI as it does not contain medical records, diagnoses, treatment information, or other individually identifiable health information.
            </p>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities Regarding PHI</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 my-4">
              <p className="text-gray-800 font-semibold mb-2">Important Guideline:</p>
              <p className="text-gray-700">
                Users should NOT share Protected Health Information (PHI) through the CareConnect platform.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.1 What NOT to Share on CareConnect</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Do not share the following through our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Medical records or health history</li>
              <li>Diagnoses or medical conditions</li>
              <li>Treatment plans or prescriptions</li>
              <li>Mental health information</li>
              <li>Insurance claim information</li>
              <li>Social Security numbers</li>
              <li>Medical Record Numbers (MRNs)</li>
              <li>Any other individually identifiable health information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Appropriate Information to Share</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Information appropriate for CareConnect includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>General service needs (e.g., looking for residential care services)</li>
              <li>Waiver type (e.g., CADI waiver, DD waiver)</li>
              <li>Preferred location and timeline</li>
              <li>Contact information for follow-up</li>
              <li>General questions about services offered</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Direct Communication</h3>
            <p className="text-gray-700 leading-relaxed">
              Detailed health information and care arrangements should be discussed directly between the care seeker (or their representative) and the care provider through secure, HIPAA-compliant channels outside of the CareConnect platform.
            </p>
          </section>

          {/* Security Measures */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Security Measures</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              While CareConnect is not subject to HIPAA regulations, we implement industry-standard security measures to protect all user information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Encryption:</strong> Data is encrypted in transit using SSL/TLS and at rest in our database</li>
              <li><strong>Access Controls:</strong> Strict authentication and authorization controls limit data access</li>
              <li><strong>Secure Infrastructure:</strong> Our platform is hosted on secure, enterprise-grade cloud infrastructure</li>
              <li><strong>Regular Updates:</strong> We perform regular security updates and monitoring</li>
              <li><strong>Data Minimization:</strong> We collect only the information necessary to provide our services</li>
              <li><strong>Audit Logging:</strong> We maintain logs of system access and changes</li>
            </ul>
          </section>

          {/* Provider Obligations */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Care Provider HIPAA Obligations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Licensed care providers who use CareConnect may be Covered Entities under HIPAA. These providers remain independently responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Complying with all HIPAA requirements in their operations</li>
              <li>Maintaining appropriate Business Associate Agreements with their service providers</li>
              <li>Implementing required safeguards for PHI in their care facilities</li>
              <li>Training staff on HIPAA compliance</li>
              <li>Handling patient information according to HIPAA Privacy and Security Rules</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              CareConnect does not assume any HIPAA obligations on behalf of providers. Once connected through our platform, all care relationships and information exchanges are the responsibility of the provider and the individual receiving care (or their representative).
            </p>
          </section>

          {/* Case Manager Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Responsibilities of Case Managers and Social Workers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Case managers, social workers, and discharge planners using CareConnect should:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use CareConnect only for initial provider searches and connections</li>
              <li>Not share client PHI through the platform</li>
              <li>Follow their organizations HIPAA policies when working with clients</li>
              <li>Use appropriate secure channels for sharing detailed health information with providers</li>
              <li>Obtain necessary consents and authorizations from clients before sharing information</li>
              <li>Document their use of CareConnect in accordance with their professional requirements</li>
            </ul>
          </section>

          {/* Data Handling */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. How We Handle User Data</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">8.1 Data Collection</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect only the information necessary to facilitate connections and operate our platform. See our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> for details.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">8.2 Data Retention</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain user information only as long as necessary for our business purposes and legal obligations. Users may request deletion of their accounts and associated data.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4">8.3 Data Sharing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell user data. Information is shared only:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>With providers when you initiate contact</li>
              <li>With service providers who help operate our platform (under strict confidentiality)</li>
              <li>When required by law</li>
            </ul>
          </section>

          {/* Reporting Concerns */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Reporting Privacy Concerns</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you believe that PHI has been inappropriately shared through CareConnect or if you have privacy concerns:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Contact us immediately at careconnectmkting@gmail.com</li>
              <li>We will investigate and take appropriate action</li>
              <li>For HIPAA violations by covered entities, you may also file complaints with the U.S. Department of Health and Human Services Office for Civil Rights</li>
            </ul>
          </section>

          {/* Additional Resources */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Additional Resources</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For more information about HIPAA:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>U.S. Department of Health and Human Services: <a href="https://www.hhs.gov/hipaa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.hhs.gov/hipaa</a></li>
              <li>Minnesota Department of Human Services: <a href="https://mn.gov/dhs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mn.gov/dhs</a></li>
            </ul>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Updates to This Statement</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this HIPAA Compliance Statement from time to time. We will notify users of material changes through email or platform notifications.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For questions about this HIPAA Compliance Statement or privacy concerns:
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