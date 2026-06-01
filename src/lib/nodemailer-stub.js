// Stub — nodemailer is required by @auth/core internals but we send email
// via Resend's HTTP API directly. This stub satisfies the import without
// adding the nodemailer package as a dependency.
module.exports = {
  createTransport: () => ({
    sendMail:   () => Promise.resolve({ messageId: 'stub' }),
    verify:     () => Promise.resolve(true),
    close:      () => {},
  }),
}
