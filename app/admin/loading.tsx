export default function Loading() {
  return (
    <main className="admin-login" aria-busy="true">
      <div className="login-panel">
        <div
          className="admin-skeleton"
          aria-label="Loading studio / جارٍ تحميل الاستوديو"
        >
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
