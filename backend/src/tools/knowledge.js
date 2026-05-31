const ASTROLOGY_KNOWLEDGE = {
  signs: {
    "Aries": "Aries is a cardinal fire sign, ruled by Mars. It represents initiative, courage, vital energy, and self-assertion. Placements in Aries act with directness, enthusiasm, and a pioneering spirit.",
    "Taurus": "Taurus is a fixed earth sign, ruled by Venus. It represents stability, physical comfort, persistence, value, and resources. Placements in Taurus seek security, express patience, and build enduring structures.",
    "Gemini": "Gemini is a mutable air sign, ruled by Mercury. It represents curiosity, communication, intellectual agility, and duality. Placements in Gemini are expressive, adaptable, and constantly seeking connection.",
    "Cancer": "Cancer is a cardinal water sign, ruled by the Moon. It represents emotional depth, protection, family, intuition, and memory. Placements in Cancer seek nurturing, express vulnerability, and value domestic peace.",
    "Leo": "Leo is a fixed fire sign, ruled by the Sun. It represents creativity, self-expression, loyalty, warmth, and sovereignty. Placements in Leo seek recognition, express generous pride, and radiate natural authority.",
    "Virgo": "Virgo is a mutable earth sign, ruled by Mercury. It represents service, analysis, refinement, health, and practicality. Placements in Virgo are meticulous, helpful, analytical, and seek self-improvement.",
    "Libra": "Libra is a cardinal air sign, ruled by Venus. It represents harmony, relationships, justice, aesthetic beauty, and compromise. Placements in Libra seek balance, value partnership, and act with diplomatic grace.",
    "Scorpio": "Scorpio is a fixed water sign, co-ruled by Mars and Pluto. It represents transformation, emotional intensity, psychological depth, secrets, and shared resources. Placements in Scorpio seek truth, exhibit resilience, and hold deep secrets.",
    "Sagittarius": "Sagittarius is a mutable fire sign, ruled by Jupiter. It represents philosophy, expansion, travel, optimism, and direct truth. Placements in Sagittarius seek wisdom, express freedom, and explore horizons.",
    "Capricorn": "Capricorn is a cardinal earth sign, ruled by Saturn. It represents discipline, structure, social ambition, patience, and duty. Placements in Capricorn seek status, respect boundaries, and build legacy through labor.",
    "Aquarius": "Aquarius is a fixed air sign, ruled by Saturn and Uranus. It represents progressive ideals, community networks, innovation, and humanitarian goals. Placements in Aquarius think collectively, value freedom, and question structures.",
    "Pisces": "Pisces is a mutable water sign, ruled by Jupiter and Neptune. It represents mysticism, compassion, imagination, dissolution of boundaries, and collective consciousness. Placements in Pisces are highly sensitive, artistic, and seek spiritual unity."
  },
  houses: {
    "1": "The First House (Ascendant/Lagna) represents the self, physical vitality, appearance, outer personality, and the lens through which we view the world. Planets here highly color our physical constitution and immediate instincts.",
    "2": "The Second House represents wealth, personal assets, speech, values, family heritage, and self-worth. Planets here indicate our relationship to material resource security.",
    "3": "The Third House represents local communication, siblings, courage, mental agility, writing, short travels, and manual skills. Planets here shape our immediate communicative style.",
    "4": "The Fourth House (Imum Coeli) represents home, roots, emotional foundation, the mother, private life, and late-life security. Planets here indicate our emotional wellspring and domestic habits.",
    "5": "The Fifth House represents creativity, individual expression, children, romantic passion, speculative intelligence, and devotional practices. Planets here represent play, luck, and intellectual fruits.",
    "6": "The Sixth House represents daily work, physical health, diet, challenges, debts, and daily routines of service. Planets here represent our labor, healing habits, and response to adversity.",
    "7": "The Seventh House (Descendant) represents partnerships, marriage, open contracts, public relationships, and our projection of others. Planets here show our path to relational balance.",
    "8": "The Eighth House represents shared resources, investments, psychological depth, inheritances, secrets, and systemic transformations (birth, death, rebirth). Planets here show deep resources.",
    "9": "The Ninth House represents higher philosophy, long journeys, teachers (Gurus), ethical values, and spiritual devotion. Planets here represent our quest for truth and global alignment.",
    "10": "The Tenth House (Midheaven) represents career, public status, authority, social legacy, and vocational achievements. Planets here shape our public reputation and professional callings.",
    "11": "The Eleventh House represents friendship circles, group networks, community goals, earnings from career, and long-term hopes. Planets here show our social ideals and gains.",
    "12": "The Twelfth House represents solitude, subconscious dynamics, spiritual liberation (Moksha), losses, and psychological transition. Planets here represent dreamscapes and private devotion."
  },
  placements: {
    "Sun in 10th House": "The Sun in the 10th House shines brightly in the career sector. Vocational achievement and public recognition are core drivers. There is a strong pull to lead and be seen as a natural authority, though one must guard against excessive career ego.",
    "Moon in 10th House": "The Moon in the 10th House indicates that the emotional landscape is tied to professional standing. One's career can involve public nurturing or emotional connection. Reputational status fluctuates like the tide, necessitating inner alignment.",
    "Saturn in 10th House": "Saturn in the 10th House represents a classic placement of massive career responsibility built through discipline, patience, and delayed rewards. Success is achieved through enduring duty, and early challenges pave the way for stable late-life legacy.",
    "Sun in 7th House": "The Sun in the 7th House places the light of identity in the sector of partnership. Self-discovery is achieved through relationships, making diplomatic compromise and clear boundaries essential.",
    "Moon in 1st House": "The Moon in the 1st House grants deep emotional sensitivity, instant empathy, and a highly responsive physical presence. Feelings are visible on the sleeve, making emotional grounding crucial."
  }
};

function knowledgeLookup(query) {
  if (!query) return "No reference query provided.";
  
  const normalized = query.toLowerCase();
  const matches = [];

  for (const [sign, text] of Object.entries(ASTROLOGY_KNOWLEDGE.signs)) {
    if (normalized.includes(sign.toLowerCase())) {
      matches.push(`🌟 [Zodiac Sign: ${sign}] ${text}`);
    }
  }

  for (const [houseNum, text] of Object.entries(ASTROLOGY_KNOWLEDGE.houses)) {
    const houseName = getOrdinalName(parseInt(houseNum));
    if (normalized.includes(`house ${houseNum}`) || 
        normalized.includes(`${houseName} house`) || 
        normalized.includes(`${houseNum}st house`) || 
        normalized.includes(`${houseNum}nd house`) || 
        normalized.includes(`${houseNum}rd house`) || 
        normalized.includes(`${houseNum}th house`)) {
      matches.push(`🏠 [House ${houseNum}] ${text}`);
    }
  }

  for (const [placement, text] of Object.entries(ASTROLOGY_KNOWLEDGE.placements)) {
    if (normalized.includes(placement.toLowerCase())) {
      matches.push(`🔮 [Placement: ${placement}] ${text}`);
    }
  }

  if (matches.length === 0) {
    return "No direct reference matches found. Interpret based on standard Western/Vedic cosmic archetypes, prioritizing spiritual reflection, warmth, and self-discovery.";
  }

  return matches.slice(0, 3).join("\n\n");
}

function getOrdinalName(num) {
  const ordinals = [
    "", "first", "second", "third", "fourth", "fifth", "sixth",
    "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"
  ];
  return ordinals[num] || "";
}

module.exports = {
  knowledgeLookup
};
