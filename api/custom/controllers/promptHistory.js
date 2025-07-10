const mongoose = require('mongoose');

const MAX_HISTORY_LENGTH = 100;

const savePromptHistory = async (req, res) => {
  try {
    const PromptHistory = require('~/custom/models/PromptHistory');
    const { groupId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid groupId format' });
    }

    // ค้นหา history ของ user หรือสร้างใหม่ถ้าไม่มี
    let userHistory = await PromptHistory.findOne({ user: userId });
    
    if (!userHistory) {
      userHistory = new PromptHistory({
        user: userId,
        history: []
      });
    }

    // แปลง history เป็น Set เพื่อจัดการ
    const historySet = new Set(userHistory.history.map(id => id.toString()));
    
    // ลบ groupId ออกจาก Set (ถ้ามี)
    historySet.delete(groupId);
    
    // เพิ่ม groupId เข้าไปใหม่ (จะเป็นตัวล่าสุด)
    historySet.add(groupId);
    
    // แปลงกลับเป็น array และจำกัดขนาดไม่เกิน MAX_HISTORY_LENGTH
    userHistory.history = Array.from(historySet).map(id => new mongoose.Types.ObjectId(id)).slice(-MAX_HISTORY_LENGTH);
    
    await userHistory.save();

    res.json(userHistory.history);
  } catch (error) {
    console.error('Error saving prompt history:', error);
    res.status(500).json({ error: 'Failed to save prompt history' });
  }
};

const getRecentPrompts = async (req, res) => {
  try {
    const PromptHistory = require('~/custom/models/PromptHistory');
    const userId = req.user.id;
    
    // ค้นหา history ของ user
    const userHistory = await PromptHistory.findOne({ user: userId });
    
    if (!userHistory || !userHistory.history || userHistory.history.length === 0) {
      return res.json([]);
    }

    // return history by user ตามที่ร้องขอ
    res.json(userHistory.history);
  } catch (error) {
    console.error('Error fetching recent prompts:', error);
    res.status(500).json({ error: 'Failed to fetch recent prompts' });
  }
};

module.exports = {
  savePromptHistory,
  getRecentPrompts
}; 