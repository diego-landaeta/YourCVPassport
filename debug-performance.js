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
  console.clear();
  console.log('%c🔍 INICIANDO DIAGNÓSTICO DE PERFORMANCE', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
  console.log('━'.repeat(60));

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

    console.log(`🌐 [${requestId}] Fetch iniciado: ${url}`);

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

      console.log(`✅ [${requestId}] Fetch completado: ${duration}ms - ${url}`);

      return response;
    }).catch(error => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.error(`❌ [${requestId}] Fetch error: ${duration}ms - ${url}`, error);

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
        console.log('✅ Cliente de Supabase detectado');

        // Interceptar .from()
        const originalFrom = (window.supabase || window._supabaseClient).from;
        if (originalFrom) {
          (window.supabase || window._supabaseClient).from = function(table) {
            const queryId = ++supabaseQueryCounter;
            const startTime = performance.now();

            console.log(`🗄️  [Q${queryId}] Supabase query iniciado: ${table}`);

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

                  console.log(`✅ [Q${queryId}] Supabase query completado: ${duration}ms - ${table} (${data?.data?.length || 0} rows)`);

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
      console.log('⚛️  React detectado, monitoreando re-renders...');

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
            console.log(`⚛️  Re-render: ${componentName}`);
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
    console.clear();
    console.log('%c📊 REPORTE DE PERFORMANCE', 'background: #2196F3; color: white; padding: 10px; font-size: 18px; font-weight: bold;');
    console.log('━'.repeat(60));

    // Network Requests
    console.log('\n%c🌐 NETWORK REQUESTS', 'color: #FF9800; font-size: 14px; font-weight: bold;');
    console.log(`Total de requests: ${requests.length}`);

    if (requests.length > 0) {
      const totalDuration = requests.reduce((sum, req) => sum + parseFloat(req.duration), 0);
      console.log(`Tiempo total: ${totalDuration.toFixed(2)}ms`);
      console.log(`Promedio por request: ${(totalDuration / requests.length).toFixed(2)}ms`);

      // Requests más lentos
      const slowest = [...requests].sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration)).slice(0, 5);
      console.log('\n🐌 Top 5 requests más lentos:');
      console.table(slowest.map(r => ({
        ID: r.id,
        URL: r.url.substring(0, 50) + '...',
        Duración: r.duration + 'ms',
        Status: r.status || r.error
      })));
    }

    // Supabase Queries
    console.log('\n%c🗄️  SUPABASE QUERIES', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    console.log(`Total de queries: ${supabaseQueries.length}`);

    if (supabaseQueries.length > 0) {
      const totalDuration = supabaseQueries.reduce((sum, q) => sum + parseFloat(q.duration), 0);
      console.log(`Tiempo total: ${totalDuration.toFixed(2)}ms`);
      console.log(`Promedio por query: ${(totalDuration / supabaseQueries.length).toFixed(2)}ms`);

      // Queries por tabla
      const byTable = {};
      supabaseQueries.forEach(q => {
        if (!byTable[q.table]) byTable[q.table] = [];
        byTable[q.table].push(q);
      });

      console.log('\n📊 Queries por tabla:');
      Object.keys(byTable).forEach(table => {
        const queries = byTable[table];
        const totalTime = queries.reduce((sum, q) => sum + parseFloat(q.duration), 0);
        console.log(`  ${table}: ${queries.length} queries (${totalTime.toFixed(2)}ms total)`);
      });

      // Queries más lentas
      const slowest = [...supabaseQueries].sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration)).slice(0, 5);
      console.log('\n🐌 Top 5 queries más lentas:');
      console.table(slowest.map(q => ({
        ID: q.id,
        Tabla: q.table,
        Query: q.query,
        Duración: q.duration + 'ms',
        Filas: q.rowCount
      })));
    }

    // React Re-renders
    console.log('\n%c⚛️  REACT RE-RENDERS', 'color: #61DAFB; font-size: 14px; font-weight: bold;');

    const renderCounts = {};
    componentRenders.forEach(r => {
      renderCounts[r.component] = (renderCounts[r.component] || 0) + 1;
    });

    const topRenders = Object.entries(renderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topRenders.length > 0) {
      console.log('🔄 Top 10 componentes con más re-renders:');
      console.table(topRenders.map(([name, count]) => ({
        Componente: name,
        'Re-renders': count
      })));
    } else {
      console.log('No se detectaron re-renders (React puede estar en producción)');
    }

    // Performance Metrics
    console.log('\n%c⏱️  PERFORMANCE METRICS', 'color: #9C27B0; font-size: 14px; font-weight: bold;');
    if (performanceMetrics.measurements.length > 0) {
      console.table(performanceMetrics.measurements);
    }

    // Recomendaciones
    console.log('\n%c💡 RECOMENDACIONES', 'color: #FFC107; font-size: 14px; font-weight: bold;');

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
      console.log('✅ No se detectaron problemas obvios de performance.');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }

    console.log('\n' + '━'.repeat(60));
    console.log('%c✅ REPORTE COMPLETADO', 'background: #4CAF50; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
  };

  // ============================================
  // 6. AUTO-GENERAR REPORTE AL CARGAR DASHBOARD
  // ============================================

  let dashboardLoaded = false;

  const observer = new MutationObserver(() => {
    const url = window.location.href;
    if (url.includes('/dashboard') && !dashboardLoaded) {
      dashboardLoaded = true;
      console.log('📍 Dashboard detectado, generando reporte en 3 segundos...');

      setTimeout(() => {
        window.generatePerformanceReport();
      }, 3000);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ============================================
  // 7. COMANDOS DISPONIBLES
  // ============================================

  console.log('\n%c📝 COMANDOS DISPONIBLES', 'color: #00BCD4; font-size: 14px; font-weight: bold;');
  console.log('Ejecuta estos comandos en cualquier momento:');
  console.log('  generatePerformanceReport() - Generar reporte completo');
  console.log('  console.table(requests) - Ver todas las requests HTTP');
  console.log('  console.table(supabaseQueries) - Ver todas las queries Supabase');
  console.log('\n' + '━'.repeat(60));

})();

console.log('✅ Diagnóstico iniciado. Navega al Dashboard para ver resultados.');
