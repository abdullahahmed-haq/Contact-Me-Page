"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="admin-login">
      <section className="login-panel">
        <h1>
          Studio unavailable
          <br />
          الاستوديو غير متاح
        </h1>
        <p>
          Check the database connection and run migrations before retrying.
          <br />
          تحقق من اتصال قاعدة البيانات وشغّل الترحيلات ثم حاول مجددًا.
        </p>
        <button className="admin-button primary" onClick={reset}>
          Try again / حاول مرة أخرى
        </button>
      </section>
    </main>
  );
}
