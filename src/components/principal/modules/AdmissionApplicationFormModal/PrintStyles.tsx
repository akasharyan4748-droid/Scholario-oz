/**
 * Print-specific CSS injected globally to isolate the A4 application form
 * during browser print. Hidden by default; applied only inside the modal.
 */
export function ApplicationFormPrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden;
        }
        #a4-application-form, #a4-application-form * {
          visibility: visible;
        }
        #a4-application-form {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-before: always;
          break-before: page;
        }
      }
    `}</style>
  )
}
