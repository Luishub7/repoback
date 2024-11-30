import pool from '../config/db.js';

export const getTools = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tools');
    res.json(rows);
  } catch (err) {
    next(err); // Pasa el error al middleware de manejo de errores
  }
};

export const createTool = async (req, res, next) => {
  const { name, category, stock, price } = req.body;
  if (!name || !category || !stock || !price) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }
  try {
    const [existingTool] = await pool.query('SELECT * FROM tools WHERE name = ?', [name]);
    if (existingTool.length > 0) {
      return res.status(400).json({ message: 'La herramienta ya existe' });
    }
    const [result] = await pool.query('INSERT INTO tools (name, category, stock, price) VALUES (?, ?, ?, ?)', [
      name,
      category,
      stock,
      price,
    ]);

    const [newTool] = await pool.query('SELECT * FROM tools WHERE id = ?', [result.insertId]);
    res.status(201).json(newTool[0]);
  } catch (err) {
    next(err);
  }
};

export const updateTool = async (req, res, next) => {
  const { id } = req.params;
  const { name, category, stock, price } = req.body;

  if (!name || !category || !stock || !price) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const [existingTool] = await pool.query('SELECT * FROM tools WHERE name = ? AND id != ?', [name, id]);
    if (existingTool.length > 0) {
      return res.status(400).json({ message: 'El nombre de la herramienta ya está en uso' });
    }

    const [result] = await pool.query(
      'UPDATE tools SET name = ?, category = ?, stock = ?, price = ? WHERE id = ?',
      [name, category, stock, price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Herramienta no encontrada' });
    }

    const [updatedTool] = await pool.query('SELECT * FROM tools WHERE id = ?', [id]);
    res.json(updatedTool[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteTool = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM tools WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Herramienta no encontrada' });
    }
    res.json({ message: 'Herramienta eliminada exitosamente' });
  } catch (err) {
    next(err);
  }
};