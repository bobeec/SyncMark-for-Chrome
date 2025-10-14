# Security Policy / セキュリティポリシー

## 🛡️ サポートされているバージョン / Supported Versions

現在セキュリティアップデートがサポートされているバージョン：  
Currently supported versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## 🚨 脆弱性の報告 / Reporting a Vulnerability

セキュリティ脆弱性を発見した場合は、以下の手順に従ってください：  
If you discover a security vulnerability, please follow these steps:

### 🔒 責任ある開示 / Responsible Disclosure

1. **公開しないでください** / **DO NOT** create a public issue
2. **直接報告してください** / Report directly via:
   - GitHub Security Advisories (推奨 / Recommended)
   - Email: [セキュリティ担当者メール / Security contact email]

### 📋 報告に含めるべき情報 / Information to Include

以下の情報を含めてください：  
Please include the following information:

- **脆弱性の種類** / Type of vulnerability
- **影響を受けるコンポーネント** / Affected components
- **再現手順** / Steps to reproduce
- **潜在的な影響** / Potential impact
- **修正案（あれば）** / Suggested fix (if any)

### 📝 脆弱性レポートテンプレート / Vulnerability Report Template

```
## 脆弱性の概要 / Vulnerability Summary
[Brief description of the vulnerability]

## 影響を受けるコンポーネント / Affected Components
- [ ] Web Application / Webアプリケーション
- [ ] Chrome Extension / Chrome拡張機能  
- [ ] API Backend / APIバックエンド
- [ ] Database / データベース
- [ ] Authentication / 認証システム

## 脆弱性の種類 / Vulnerability Type
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] SQL Injection
- [ ] Authentication Bypass / 認証回避
- [ ] Authorization Issues / 認可問題
- [ ] Data Exposure / データ漏洩
- [ ] Other / その他: ___________

## 深刻度 / Severity Level
- [ ] Critical / 緊急 (CVSS 9.0-10.0)
- [ ] High / 高 (CVSS 7.0-8.9)  
- [ ] Medium / 中 (CVSS 4.0-6.9)
- [ ] Low / 低 (CVSS 0.1-3.9)

## 再現手順 / Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## 期待される動作 / Expected Behavior
[What should happen]

## 実際の動作 / Actual Behavior  
[What actually happens]

## 潜在的な影響 / Potential Impact
[Description of potential impact]

## 環境情報 / Environment
- Browser: [Chrome/Edge/etc.]
- Version: [Application version]
- OS: [Operating system]

## 修正案 / Suggested Fix
[If you have suggestions for fixing the vulnerability]

## 追加情報 / Additional Information
[Any other relevant information]
```

## ⏱️ 対応タイムライン / Response Timeline

| 深刻度 / Severity | 初期対応 / Initial Response | 修正 / Fix | 公開 / Disclosure |
|------------------|-------------------------|-----------|------------------|
| Critical / 緊急   | 24時間以内 / Within 24h    | 72時間以内 / Within 72h | 修正後7日 / 7 days after fix |
| High / 高        | 48時間以内 / Within 48h    | 1週間以内 / Within 1 week | 修正後14日 / 14 days after fix |
| Medium / 中      | 1週間以内 / Within 1 week  | 1ヶ月以内 / Within 1 month | 修正後30日 / 30 days after fix |
| Low / 低         | 2週間以内 / Within 2 weeks | 次回リリース / Next release | 修正後60日 / 60 days after fix |

## 🏆 謝辞 / Acknowledgments

セキュリティ脆弱性を責任を持って報告してくださった方々に感謝いたします：  
We thank the following individuals for responsibly disclosing security vulnerabilities:

<!-- セキュリティ研究者のリストがここに追加されます -->
<!-- Security researchers will be listed here -->

## 🔐 セキュリティのベストプラクティス / Security Best Practices

### 開発者向け / For Developers

- **依存関係を最新に保つ** / Keep dependencies up to date
- **定期的なセキュリティ監査** / Regular security audits
- **入力検証を実装** / Implement input validation
- **適切な認証・認可** / Proper authentication and authorization
- **HTTPS の使用** / Use HTTPS everywhere

### ユーザー向け / For Users

- **拡張機能を最新版に更新** / Keep extension updated
- **信頼できるソースからのみインストール** / Install only from trusted sources
- **怪しいリンクをクリックしない** / Don't click suspicious links
- **強力なパスワードを使用** / Use strong passwords
- **2FA の有効化** / Enable 2FA when available

## 📚 参考資料 / References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## 🆘 緊急時の連絡先 / Emergency Contact

重大なセキュリティインシデントが発生した場合：  
For critical security incidents:

- **GitHub Security Advisories** (推奨 / Recommended)
- **Issue で @bocotime をメンション** / Mention @bocotime in issues
- **緊急時のみ直接連絡** / Direct contact for emergencies only

---

**セキュリティはコミュニティ全体の責任です** 🔒  
**Security is a community responsibility** 🔒