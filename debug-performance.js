/**
 * SCRIPT DE DIAGNÓSTICO DE PERFORMANCE
 *
 * Ejecuta este script en la consola de Chrome para identificar
 * exactamente qué está causando la lentitud
 *
 * USO:
 * 1. Abre Chrome DevTools (F12)
 * 2. Ve a la pestaña "Console"
 * 3. Copia y pega todo este código
 * 4. Presiona Enter
 * 5. Navega al Dashboard
 * 6. Revisa el reporte generado
 */

(function() {
  
  
  

  // ============================================
  // 1. MONITOR DE NETWORK REQUESTS
  // ============================================

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  const requests = [];
  let requestCounter = 0;

  // Interceptar fetch
  window.fetch = function(...args) {
    const startTime = performance.now();
    const requestId = ++requestCounter;
    const url = args[0];

    

    return originalFetch.apply(this, args).then(response => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      const requestInfo = {
        id: requestId,
        type: 'fetch',
        url: url,
        method: args[1]?.method || 'GET',
        status: response.status,
        duration: duration,
        timestamp: new Date().toISOString()
      };

      requests.push(requestInfo);

      

      return response;
    }).catch(error => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      

      requests.push({
        id: requestId,
        type: 'fetch',
        url: url,
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString()
      });

      throw error;
    });
  };

  // ============================================
  // 2. MONITOR DE SUPABASE QUERIES
  // ============================================

  let supabaseQueries = [];
  let supabaseQueryCounter = 0;

  // Interceptar llamadas a Supabase
  const monitorSupabase = () => {
    // Buscar el cliente de Supabase en window
    const checkSupabase = setInterval(() => {
      if (window.supabase || window._supabaseClient) {
        clearInterval(checkSupabase);
        

        // Interceptar .from()
        const originalFrom = (window.supabase || window._supabaseClient).from;
        if (originalFrom) {
          (window.supabase || window._supabaseClient).from = function(table) {
            const queryId = ++supabaseQueryCounter;
            const startTime = performance.now();

            

            const builder = originalFrom.call(this, table);

            // Interceptar .select()
            const originalSelect = builder.select;
            builder.select = function(...args) {
              const result = originalSelect.apply(this, args);

              // Interceptar la promesa final
              const originalThen = result.then;
              result.then = function(onFulfilled, onRejected) {
                return originalThen.call(this, function(data) {
                  const endTime = performance.now();
                  const duration = (endTime - startTime).toFixed(2);

                  supabaseQueries.push({
                    id: queryId,
                    table: table,
                    query: args[0] || '*',
                    duration: duration,
                    rowCount: data?.data?.length || 0,
                    timestamp: new Date().toISOString()
                  });

                  

                  return onFulfilled ? onFulfilled(data) : data;
                }, onRejected);
              };

              return result;
            };

            return builder;
          };
        }
      }
    }, 100);

    // Timeout después de 5 segundos
    setTimeout(() => clearInterval(checkSupabase), 5000);
  };

  monitorSupabase();

  // ============================================
  // 3. MONITOR DE REACT RE-RENDERS
  // ============================================

  let componentRenders = [];

  const monitorReactRenders = () => {
    if (window.React) {
      

      // Hook en React.createElement
      const originalCreateElement = React.createElement;
      React.createElement = function(type, props, ...children) {
        if (typeof type === 'function' || typeof type === 'object') {
          const componentName = type.name || type.displayName || 'Anonymous';

          componentRenders.push({
            component: componentName,
            timestamp: new Date().toISOString()
          });

          // Solo log para componentes importantes
          if (componentName.includes('Dashboard') || componentName.includes('Content')) {
            
          }
        }

        return originalCreateElement.apply(this, arguments);
      };
    }
  };

  setTimeout(monitorReactRenders, 1000);

  // ============================================
  // 4. MONITOR DE PERFORMANCE METRICS
  // ============================================

  const performanceMetrics = {
    startTime: performance.now(),
    measurements: []
  };

  // Medir Navigation Timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];

      if (perfData) {
        performanceMetrics.measurements.push({
          metric: 'DNS Lookup',
          value: (perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2) + 'ms'
        });

        performanceMetrics.measurements.push({
          metric: 'TCP Connection',
          value: (perfData.connectEnd - perfData.connectStart).toFixed(2) + 'ms'
        });

        performanceMetrics.measurements.push({
          metric: 'Request Time',
          value: (perfData.responseStart - perfData.requestStart).toFixed(2) + 'ms'
        });

        performanceMetrics.measurements.push({
          metric: 'Response Time',
          value: (perfData.responseEnd - perfData.responseStart).toFixed(2) + 'ms'
        });

        performanceMetrics.measurements.push({
          metric: 'DOM Processing',
          value: (perfData.domComplete - perfData.domLoading).toFixed(2) + 'ms'
        });

        performanceMetrics.measurements.push({
          metric: 'Total Load Time',
          value: (perfData.loadEventEnd - perfData.fetchStart).toFixed(2) + 'ms'
        });
      }
    }, 1000);
  });

  // ============================================
  // 5. GENERAR REPORTE
  // ============================================

  window.generatePerformanceReport = function() {
    
    
    

    // Network Requests
    
    

    if (requests.length > 0) {
      const totalDuration = requests.reduce((sum, req) => sum + parseFloat(req.duration), 0);
      
      

      // Requests más lentos
      const slowest = [...requests].sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration)).slice(0, 5);
      
      
    }

    // Supabase Queries
    
    

    if (supabaseQueries.length > 0) {
      const totalDuration = supabaseQueries.reduce((sum, q) => sum + parseFloat(q.duration), 0);
      
      

      // Queries por tabla
      const byTable = {};
      supabaseQueries.forEach(q => {
        if (!byTable[q.table]) byTable[q.table] = [];
        byTable[q.table].push(q);
      });

      
      Object.keys(byTable).forEach(table => {
        const queries = byTable[table];
        const totalTime = queries.reduce((sum, q) => sum + parseFloat(q.duration), 0);
        
      });

      // Queries más lentas
      const slowest = [...supabaseQueries].sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration)).slice(0, 5);
      
      
    }

    // React Re-renders
    

    const renderCounts = {};
    componentRenders.forEach(r => {
      renderCounts[r.component] = (renderCounts[r.component] || 0) + 1;
    });

    const topRenders = Object.entries(renderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topRenders.length > 0) {
      
      
    } else {
      
    }

    // Performance Metrics
    
    if (performanceMetrics.measurements.length > 0) {
      
    }

    // Recomendaciones
    

    const recommendations = [];

    if (requests.length > 20) {
      recommendations.push('⚠️  Demasiadas requests HTTP (>20). Considera batch requests o caching.');
    }

    if (supabaseQueries.length > 10) {
      recommendations.push('⚠️  Demasiadas queries a Supabase (>10). Considera joins o caching.');
    }

    const slowRequests = requests.filter(r => parseFloat(r.duration) > 1000);
    if (slowRequests.length > 0) {
      recommendations.push(`⚠️  ${slowRequests.length} requests toman >1 segundo. Optimiza estas queries.`);
    }

    const duplicateTables = Object.entries(
      supabaseQueries.reduce((acc, q) => {
        acc[q.table] = (acc[q.table] || 0) + 1;
        return acc;
      }, {})
    ).filter(([_, count]) => count > 3);

    if (duplicateTables.length > 0) {
      recommendations.push(`⚠️  Queries duplicadas detectadas: ${duplicateTables.map(([t, c]) => `${t} (${c}x)`).join(', ')}`);
    }

    if (recommendations.length === 0) {
      
    } else {
      recommendations.forEach(rec => );
    }

    
    
  };

  // ============================================
  // 6. AUTO-GENERAR REPORTE AL CARGAR DASHBOARD
  // ============================================

  let dashboardLoaded = false;

  const observer = new MutationObserver(() => {
    const url = window.location.href;
    if (url.includes('/dashboard') && !dashboardLoaded) {
      dashboardLoaded = true;
      

      setTimeout(() => {
        window.generatePerformanceReport();
      }, 3000);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ============================================
  // 7. COMANDOS DISPONIBLES
  // ============================================

  
  
  
  
  
  

})();


