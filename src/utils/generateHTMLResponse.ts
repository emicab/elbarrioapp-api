interface HtmlResponseOptions {
    title: string;
    message: string;
    status: 'success' | 'error' | 'info'; // Añadido 'info' para la página de confirmación
    form?: string; // Opcional, para incluir el formulario de canje
  }
  
  const colors = {
    background: '#0D1117',
    textPrimary: '#F0F6FC',
    textSecondary: '#8B949E',
    success: '#4ADE80',
    error: '#F87171',
    accent: '#E040FB', // Color de acento para botones de confirmación
    card: 'rgba(30, 30, 30, 0.8)',
  };
  
  export const generateHtmlResponse = ({ title, message, status, form }: HtmlResponseOptions): string => {
    let accentColor: string;
    switch (status) {
      case 'success':
        accentColor = colors.success;
        break;
      case 'error':
        accentColor = colors.error;
        break;
      default:
        accentColor = colors.textPrimary;
    }
  
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ElBarrioApp - ${title}</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
              body {
                  font-family: 'Inter', sans-serif;
                  background-color: ${colors.background};
                  color: ${colors.textPrimary};
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  padding: 20px;
                  box-sizing: border-box;
              }
              .container {
                  background-color: ${colors.card};
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 16px;
                  padding: 40px;
                  text-align: center;
                  max-width: 400px;
                  width: 100%;
                  backdrop-filter: blur(10px);
                  -webkit-backdrop-filter: blur(10px);
              }
              h1 {
                  color: ${accentColor};
                  font-size: 28px;
                  margin-top: 0;
              }
              p {
                  color: ${colors.textSecondary};
                  font-size: 16px;
                  line-height: 1.5;
              }
              strong {
                color: ${colors.textPrimary};
              }
              button {
                  padding: 15px 30px;
                  font-size: 18px;
                  background-color: ${colors.accent};
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 700;
                  margin-top: 20px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>${title}</h1>
              <p>${message}</p>
              ${form || ''}
          </div>
      </body>
      </html>
    `;
  };