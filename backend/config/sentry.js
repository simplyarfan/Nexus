const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }

      // Don't send errors in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }

      return event;
    },
    ignoreErrors: [
      // Ignore common non-critical errors
      'NetworkError',
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
    ],
  });

  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture 4xx and 5xx errors
        if (error.status && error.status >= 400) {
          return true;
        }
        return true;
      },
    }),
  };
};

const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureException(error, {
      tags: context.tags || {},
      extra: context.extra || {},
      user: context.user || {},
      level: context.level || 'error',
    });
  }
};

const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureMessage(message, {
      level,
      tags: context.tags || {},
      extra: context.extra || {},
    });
  }
};

const addBreadcrumb = (breadcrumb) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

const setUser = (user) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    });
  }
};

const setContext = (name, context) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.setContext(name, context);
  }
};

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setContext,
  Sentry,
};
