// Настройки приглашения.
// Имена можно не трогать: их можно передать прямо в ссылке — ?to=Маша&from=Саша
window.LOVE = {
  herName: '',
  myName: '',

  // Куда улетают ответы (ntfy.sh, без регистрации). Данные шифруются ключом ниже.
  ntfy: 'https://ntfy.sh',
  dataTopic: 'fy-cfe537d348c6fbfc59-d',
  notifyTopic: 'fy-cfe537d348c6fbfc59-n',

  // Публичный ключ (P-256). Приватный — только в секретной ссылке на страницу ответов.
  pub: {
    x: '9_OStKTAqz_LTQR5hIW9zvWXE-q0SvndV78BvyvMsss',
    y: 'z5ohBlvlTA9mvtnMl5g6EXhUGgDI63pE3fpwono7NwI'
  },

  site: 'https://firefilltt.github.io/for-you/',
  mailbox: 'https://firefilltt.github.io/for-you/mailbox.html',
  rawAnswers: 'https://raw.githubusercontent.com/FirefillTT/for-you/main/answers.json'
};
