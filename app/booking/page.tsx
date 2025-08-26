import BookingForm from '../components/BookingForm';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Book a Service</h1>
        <BookingForm />
      </div>
    </div>
  );
}