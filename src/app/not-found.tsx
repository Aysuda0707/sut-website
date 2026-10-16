import Link from "next/link";
import { Container } from "@/components/ui/Container";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <Container narrow>
      <div className={styles.wrap}>
        <p className={styles.code}>۴۰۴</p>
        <h1 className={styles.title}>صفحه یافت نشد</h1>
        <p className={styles.text}>
          صفحه‌ای که به دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>
            بازگشت به خانه
          </Link>
          <Link href="/events" className={styles.secondary}>
            مرور آرشیو رویدادها
          </Link>
        </div>
      </div>
    </Container>
  );
}
