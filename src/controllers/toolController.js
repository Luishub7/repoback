// src/controllers/toolController.js
import pool from '../config/db.js';

// Obtener todas las herramientas
export const getTools = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tools');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener las herramientas', error: err.message });
  }
};

// Crear una herramienta nueva
export const createTool = async (req, res) => {
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

    // Consultar la herramienta recién creada
    const [newTool] = await pool.query('SELECT * FROM tools WHERE id = ?', [result.insertId]);

    res.status(201).json(newTool[0]); // Devuelve los datos de la herramienta recién creada
  } catch (err) {
    res.status(500).json({ message: 'Error al crear la herramienta', error: err.message });
  }
};

// Modificar una herramienta existente

export const updateTool = async (req, res) => {
  const { id } = req.params;
  const { name, category, stock, price } = req.body;

  if (!name || !category || !stock || !price) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Verificar si el nombre ya está siendo usado por otra herramienta
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

    // Devuelve la herramienta actualizada
    const [updatedTool] = await pool.query('SELECT * FROM tools WHERE id = ?', [id]);
    res.json(updatedTool[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar la herramienta', error: err.message });
  }
};





   /*  const [updatedTool] = await pool.query('SELECT * FROM tools WHERE id = ?', [id]);
    res.json({
      message: 'Herramienta actualizada exitosamente',
      tool: updatedTool[0], // Devuelve los datos actualizados de la herramienta
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar la herramienta', error: err.message });
  }
};
 */
// Eliminar una herramienta
export const deleteTool = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM tools WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Herramienta no encontrada' });
    }
    res.json({ message: 'Herramienta eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar la herramienta', error: err.message });
  }
};
