import { dbSelect, dbInsert, dbUpdate, dbDelete, dbUpsert } from '@/app/actions';

// This is a proxy that mimics the Supabase client API but calls our Server Actions
// to interact with the local SQLite (Drizzle) database directly from client components.
export const createClient = () => {
  return {
    rpc: async (fnName: string, args: any) => {
      // Mocked RPC. We already migrated the dashboard page to a Server Component,
      // so this RPC shouldn't be called heavily anymore.
      return { data: null, error: null };
    },
    from: (table: string) => {
      let currentQuery = {
        table,
        action: 'select',
        _select: '*',
        _order: null as any,
        _eq: [] as { col: string; val: any }[],
        _neq: [] as { col: string; val: any }[],
        _ilike: [] as { col: string; val: any; caseSensitive?: boolean }[],
        _in: [] as { col: string; vals: any[] }[],
        _limit: null as number | null,
        _single: false,
      };

      const chain = {
        select: (cols: string = '*') => {
          currentQuery.action = 'select';
          currentQuery._select = cols;
          return chain;
        },
        order: (col: string, opts: { ascending?: boolean } = { ascending: true }) => {
          currentQuery._order = { col, ascending: opts.ascending };
          return chain;
        },
        eq: (col: string, val: any) => {
          currentQuery._eq.push({ col, val });
          return chain;
        },
        neq: (col: string, val: any) => {
          currentQuery._neq.push({ col, val });
          return chain;
        },
        ilike: (col: string, val: any) => {
          currentQuery._ilike.push({ col, val, caseSensitive: false });
          return chain;
        },
        like: (col: string, val: any) => {
          currentQuery._ilike.push({ col, val, caseSensitive: true });
          return chain;
        },
        in: (col: string, vals: any[]) => {
          currentQuery._in.push({ col, vals });
          return chain;
        },
        is: (col: string, val: any) => {
          currentQuery._eq.push({ col, val });
          return chain;
        },
        filter: (col: string, operator: string, val: any) => {
          if (operator === 'eq') currentQuery._eq.push({ col, val });
          else if (operator === 'neq') currentQuery._neq.push({ col, val });
          else if (operator === 'ilike') currentQuery._ilike.push({ col, val, caseSensitive: false });
          else if (operator === 'like') currentQuery._ilike.push({ col, val, caseSensitive: true });
          else if (operator === 'in') currentQuery._in.push({ col, vals: val });
          return chain;
        },
        not: (col: string, operator: string, val: any) => {
          if (operator === 'eq') currentQuery._neq.push({ col, val });
          return chain;
        },
        range: (from: number, to: number) => {
          currentQuery._limit = to - from + 1;
          return chain;
        },
        limit: (n: number) => {
          currentQuery._limit = n;
          return chain;
        },
        single: () => {
          currentQuery._single = true;
          return chain;
        },
        maybeSingle: () => {
          currentQuery._single = true;
          return chain;
        },
        upsert: (data: any, _opts?: any) => {
          const executeUpsert = async () => {
            try {
              const res = await dbUpsert(table, data);
              return { data: res, error: null };
            } catch (error: any) {
              console.error('Upsert Error:', error);
              return { data: null, error };
            }
          };

          const promise = executeUpsert();
          const upsertChain: any = {
            select: () => upsertChain,
            single: () => upsertChain,
            then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
            catch: (onrejected?: any) => promise.catch(onrejected),
          };
          return upsertChain;
        },
        insert: (data: any) => {
          // convert snake_case to camelCase for Drizzle
          const camelData: any = {};
          for (const key in data) {
            const camel = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            camelData[camel] = data[key];
          }

          const executeInsert = async () => {
            try {
              const res = await dbInsert(table, camelData);
              if (res && typeof res === 'object') {
                const mappedRes: any = { ...res };
                for (const key in res) {
                  const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                  mappedRes[snake] = (res as any)[key];
                }
                return { data: mappedRes, error: null };
              }
              return { data: res, error: null };
            } catch (error: any) {
              console.error('Insert Error:', error);
              return { data: null, error };
            }
          };

          const promise = executeInsert();

          const insertChain: any = {
            select: () => insertChain,
            single: () => insertChain,
            then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
            catch: (onrejected?: any) => promise.catch(onrejected),
          };

          return insertChain;
        },
        update: (data: any) => {
          // convert snake_case to camelCase for Drizzle
          const camelData: any = {};
          for (const key in data) {
            const camel = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            camelData[camel] = data[key];
          }
          currentQuery.action = 'update';
          const updateChain = {
            eq: (col: string, val: any) => {
              if (col !== 'id') throw new Error('Proxy only supports updating by id');
              const executeUpdate = async () => {
                try {
                  const res = await dbUpdate(table, val, camelData);
                  if (res && typeof res === 'object') {
                    const mappedRes: any = { ...res };
                    for (const key in res) {
                      const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                      mappedRes[snake] = (res as any)[key];
                    }
                    return { data: mappedRes, error: null };
                  }
                  return { data: res, error: null };
                } catch (error: any) {
                  console.error('Update Error:', error);
                  return { data: null, error };
                }
              };

              const promise = executeUpdate();

              const updateResultChain: any = {
                select: () => updateResultChain,
                single: () => updateResultChain,
                then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
                catch: (onrejected?: any) => promise.catch(onrejected),
              };

              return updateResultChain;
            }
          };
          return updateChain;
        },
        delete: () => {
          currentQuery.action = 'delete';
          const deleteChain = {
            eq: async (col: string, val: any) => {
              if (col !== 'id') throw new Error('Proxy only supports deleting by id');
              try {
                await dbDelete(table, val);
                return { data: null, error: null };
              } catch (error: any) {
                console.error('Delete Error:', error);
                return { data: null, error };
              }
            }
          };
          return deleteChain;
        },
        then<TResult1 = any, TResult2 = never>(onfulfilled?: any, onrejected?: any): Promise<TResult1 | TResult2> {
          return new Promise((resolve, reject) => {
            const orderCol = currentQuery._order?.col 
              ? currentQuery._order.col.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())
              : undefined;

            dbSelect(
              currentQuery.table, 
              orderCol, 
              currentQuery._order?.ascending
            ).then(data => {
              let filtered = Array.isArray(data) ? [...data] : [];

              const getRowVal = (row: any, col: string) => {
                if (!row) return undefined;
                if (row[col] !== undefined) return row[col];
                const camel = col.replace(/_([a-z])/g, (_: string, g: string) => g.toUpperCase());
                return row[camel];
              };

              if (currentQuery._eq.length > 0) {
                filtered = filtered.filter((row: any) => {
                  return currentQuery._eq.every(cond => {
                    const rowVal = getRowVal(row, cond.col);
                    return rowVal === cond.val || (typeof rowVal === 'boolean' && rowVal === Boolean(cond.val));
                  });
                });
              }

              if (currentQuery._neq.length > 0) {
                filtered = filtered.filter((row: any) => {
                  return currentQuery._neq.every(cond => {
                    const rowVal = getRowVal(row, cond.col);
                    return rowVal !== cond.val;
                  });
                });
              }

              if (currentQuery._in.length > 0) {
                filtered = filtered.filter((row: any) => {
                  return currentQuery._in.every(cond => {
                    const rowVal = getRowVal(row, cond.col);
                    return Array.isArray(cond.vals) && cond.vals.includes(rowVal);
                  });
                });
              }

              if (currentQuery._ilike.length > 0) {
                filtered = filtered.filter((row: any) => {
                  return currentQuery._ilike.every(cond => {
                    const rowVal = getRowVal(row, cond.col);
                    if (rowVal === null || rowVal === undefined) return false;
                    const targetStr = String(cond.val);
                    const rowStr = String(rowVal);

                    if (targetStr.includes('%') || targetStr.includes('_')) {
                      const regexStr = '^' + targetStr
                        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                        .replace(/%/g, '.*')
                        .replace(/_/g, '.') + '$';
                      const regex = new RegExp(regexStr, cond.caseSensitive ? '' : 'i');
                      return regex.test(rowStr);
                    }

                    if (cond.caseSensitive) {
                      return rowStr === targetStr;
                    }
                    return rowStr.toLowerCase() === targetStr.toLowerCase();
                  });
                });
              }

              if (currentQuery._limit) {
                filtered = filtered.slice(0, currentQuery._limit);
              }
              const mapped = filtered.map((row: any) => {
                 const newRow = { ...row };
                 for (const key in row) {
                   const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                   newRow[snake] = row[key];
                 }
                 return newRow;
              });
              const result = currentQuery._single ? { data: mapped[0] || null, error: null } : { data: mapped, error: null };
              
              if (onfulfilled) {
                resolve(onfulfilled(result));
              } else {
                resolve(result as any);
              }
            }).catch(err => {
              console.error('Select Error:', err);
              const errResult = { data: null, error: err };
              if (onrejected) {
                resolve(onrejected(errResult));
              } else {
                resolve(errResult as any);
              }
            });
          });
        },
        catch: (onrejected?: any) => {
          return (chain as any).then(null, onrejected);
        }
      };
      
      return chain as any;
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: any) => ({ data: { path }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `/uploads/${path}` } }),
        remove: async (paths: string[]) => ({ data: paths, error: null })
      })
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'local-user' } }, error: null }),
      signOut: async () => ({ error: null })
    }
  };
};
