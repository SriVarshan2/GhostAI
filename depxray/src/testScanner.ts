import { aggregateProjectImports } from './services/astScanner.js';

const SAMPLE = `
import React, { useState, useEffect } from 'react';
import { debounce, throttle } from 'lodash';
import moment from 'moment';
import * as d3 from 'd3';
import { format } from 'date-fns/format';
import './styles.css';
import path from 'path';
`;

const result = aggregateProjectImports([{ path: 'App.tsx', code: SAMPLE }]);

for (const [pkg, details] of result.entries()) {
  const named = Array.from(details.namedImports).map(s => `"${s}"`).join(',');
  const namedStr = named.length > 0 ? `namedImports=[${named}]` : '';
  const defStr = details.defaultImport ? `defaultImport=true` : '';
  const nsStr = details.namespaceImport ? `namespaceImport=true` : '';
  
  const parts = [namedStr, defStr, nsStr].filter(Boolean).join(', ');
  console.log(`- ${pkg}: ${parts}`);
}
