import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/app/actions';

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
        _eq: [] as any[],
        _limit: null as number | null,
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
        limit: (n: number) => {
          currentQuery._limit = n;
          return chain;
        },
        single: () => {
          (currentQuery as any)._single = true;
          return chain;
        },
        insert: async (data: any) => {
          // convert snake_case to camelCase for Drizzle
          const camelData: any = {};
          for (const key in data) {
            const camel = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            camelData[camel] = data[key];
          }
          try {
            const res = await dbInsert(table, camelData);
            return { data: res, error: null };
          } catch (error: any) {
            console.error('Insert Error:', error);
            return { data: null, error };
          }
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
            eq: async (col: string, val: any) => {
              if (col !== 'id') throw new Error('Proxy only supports updating by id');
              try {
                const res = await dbUpdate(table, val, camelData);
                return { data: res, error: null };
              } catch (error: any) {
                console.error('Update Error:', error);
                return { data: null, error };
              }
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
              let filtered = data;
              if (currentQuery._eq.length > 0) {
                filtered = filtered.filter((row: any) => {
                  return currentQuery._eq.every(cond => {
                    return row[cond.col] === cond.val || row[cond.col.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())] === cond.val;
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
              const result = (currentQuery as any)._single ? { data: mapped[0] || null, error: null } : { data: mapped, error: null };
              
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
