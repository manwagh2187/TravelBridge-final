export default function CancelPage() {
  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Payment cancelled</h1>
      <p>Your booking was not completed.</p>
      <a href="/" className="btn btn-primary">Back to home</a>
    </div>
  );
}