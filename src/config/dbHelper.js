const fs = require('fs');
const { MOCK_DB_PATH } = require('./db');
const mongoose = require('mongoose');

// Helper to generate a MongoDB-like ObjectId string for fallback
const generateId = () => {
  return new mongoose.Types.ObjectId().toString();
};

// Read mock DB helper
const readMockDB = () => {
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading mock database:', error);
    return {};
  }
};

// Write mock DB helper
const writeMockDB = (data) => {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing mock database:', error);
  }
};

const dbHelper = {
  // FIND ALL matching query
  find: async (model, query = {}, options = {}) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      let q = model.find(query);
      if (options.sort) q = q.sort(options.sort);
      if (options.limit) q = q.limit(options.limit);
      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(p => q = q.populate(p));
        } else {
          q = q.populate(options.populate);
        }
      }
      return await q.exec();
    } else {
      const db = readMockDB();
      let items = db[collectionName] || [];
      
      // Filter logic
      items = items.filter(item => {
        for (let key in query) {
          if (key === '$or') {
            const orMatch = query[key].some(subQuery => {
              let subMatch = true;
              for (let subKey in subQuery) {
                const valA = item[subKey] ? item[subKey].toString() : '';
                const valB = subQuery[subKey] ? subQuery[subKey].toString() : '';
                if (valA !== valB) {
                  subMatch = false;
                  break;
                }
              }
              return subMatch;
            });
            if (!orMatch) return false;
          } else if (query[key] && typeof query[key] === 'object' && query[key].$ne !== undefined) {
            const valA = item[key] ? item[key].toString() : '';
            const valB = query[key].$ne ? query[key].$ne.toString() : '';
            if (valA === valB) return false;
          } else if (query[key] && typeof query[key] === 'object' && query[key].$in !== undefined) {
            const itemVal = item[key] ? item[key].toString() : '';
            const inArray = query[key].$in.map(v => v ? v.toString() : '');
            if (!inArray.includes(itemVal)) return false;
          } else {
            const valA = item[key] ? item[key].toString() : '';
            const valB = query[key] ? query[key].toString() : '';
            if (valA !== valB) return false;
          }
        }
        return true;
      });

      // Sorting logic
      if (options.sort) {
        const sortKeys = Object.keys(options.sort);
        if (sortKeys.length > 0) {
          const sortKey = sortKeys[0];
          const sortOrder = options.sort[sortKey]; // 1 or -1 or 'desc'/'asc'
          items.sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];
            if (typeof valA === 'string') {
              return sortOrder === -1 || sortOrder === 'desc' 
                ? valB.localeCompare(valA) 
                : valA.localeCompare(valB);
            }
            return sortOrder === -1 || sortOrder === 'desc' 
              ? valB - valA 
              : valA - valB;
          });
        }
      }

      // Limit
      if (options.limit) {
        items = items.slice(0, options.limit);
      }

      // Populate simulation: if populate is user or profile
      if (options.populate) {
        const populateField = typeof options.populate === 'string' ? options.populate : options.populate.path;
        items = items.map(item => {
          const newItem = { ...item };
          const foreignId = newItem[populateField];
          if (foreignId && typeof foreignId === 'string') {
            // Find in users or profiles
            const refCollection = populateField === 'user' || populateField === 'sender' || populateField === 'receiver' || populateField === 'alumni' || populateField === 'student' ? 'users' : 'profiles';
            const matchedRef = db[refCollection]?.find(r => r._id === foreignId || r.userId === foreignId);
            if (matchedRef) {
              newItem[populateField] = matchedRef;
            }
          }
          return newItem;
        });
      }

      return items;
    }
  },

  // FIND ONE matching query
  findOne: async (model, query = {}, options = {}) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      let q = model.findOne(query);
      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(p => q = q.populate(p));
        } else {
          q = q.populate(options.populate);
        }
      }
      return await q.exec();
    } else {
      const results = await dbHelper.find(model, query, { ...options, limit: 1 });
      return results.length > 0 ? results[0] : null;
    }
  },

  // FIND BY ID
  findById: async (model, id, options = {}) => {
    if (!id) return null;
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      let q = model.findById(id);
      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(p => q = q.populate(p));
        } else {
          q = q.populate(options.populate);
        }
      }
      return await q.exec();
    } else {
      const results = await dbHelper.find(model, { _id: id.toString() }, { ...options, limit: 1 });
      return results.length > 0 ? results[0] : null;
    }
  },

  // CREATE new document
  create: async (model, data) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      const newDoc = new model(data);
      return await newDoc.save();
    } else {
      const db = readMockDB();
      if (!db[collectionName]) {
        db[collectionName] = [];
      }
      
      const newDoc = {
        _id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      
      db[collectionName].push(newDoc);
      writeMockDB(db);
      return newDoc;
    }
  },

  // UPDATE BY ID
  findByIdAndUpdate: async (model, id, updateData, options = { new: true }) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      return await model.findByIdAndUpdate(id, updateData, options).exec();
    } else {
      const db = readMockDB();
      const items = db[collectionName] || [];
      const index = items.findIndex(item => item._id === id.toString());
      if (index === -1) return null;
      
      const updatedItem = {
        ...items[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      // If there are mongoose operators like $push, simulate them
      if (updateData.$push) {
        for (let key in updateData.$push) {
          if (!updatedItem[key]) updatedItem[key] = [];
          updatedItem[key].push(updateData.$push[key]);
        }
        delete updatedItem.$push;
      }
      if (updateData.$pull) {
        for (let key in updateData.$pull) {
          if (updatedItem[key]) {
            updatedItem[key] = updatedItem[key].filter(v => v !== updateData.$pull[key]);
          }
        }
        delete updatedItem.$pull;
      }
      
      items[index] = updatedItem;
      writeMockDB(db);
      return updatedItem;
    }
  },

  // UPDATE ONE
  updateOne: async (model, query, updateData) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      return await model.updateOne(query, updateData).exec();
    } else {
      const doc = await dbHelper.findOne(model, query);
      if (!doc) return { nModified: 0 };
      await dbHelper.findByIdAndUpdate(model, doc._id, updateData);
      return { nModified: 1 };
    }
  },

  // DELETE BY ID
  findByIdAndDelete: async (model, id) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      return await model.findByIdAndDelete(id).exec();
    } else {
      const db = readMockDB();
      const items = db[collectionName] || [];
      const index = items.findIndex(item => item._id === id.toString());
      if (index === -1) return null;
      const deletedItem = items.splice(index, 1)[0];
      writeMockDB(db);
      return deletedItem;
    }
  },

  // DELETE MANY
  deleteMany: async (model, query = {}) => {
    const collectionName = model.collection.name;
    if (!global.dbFallback) {
      return await model.deleteMany(query).exec();
    } else {
      const db = readMockDB();
      const items = db[collectionName] || [];
      const beforeCount = items.length;
      
      const remainingItems = items.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return true;
        }
        return false;
      });
      
      db[collectionName] = remainingItems;
      writeMockDB(db);
      return { deletedCount: beforeCount - remainingItems.length };
    }
  }
};

module.exports = dbHelper;
