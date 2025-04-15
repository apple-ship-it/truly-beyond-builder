import React, { useState, useEffect } from "react";
import classesData from "./classes.json";
import "./CharacterSheet.css";

/* ------------------ Helper Functions ------------------ */
function titleCase(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function parseLevelRange(rangeStr) {
  const cleaned = rangeStr.replace(/[^\d\-]/g, "");
  if (cleaned.includes("-")) {
    const [start, end] = cleaned.split("-").map(Number);
    return [start, end];
  } else {
    const single = parseInt(cleaned, 10);
    return [single, single];
  }
}

function getSpellChunksForLevel(spellChunks, level) {
  const unlocked = [];
  for (const chunkStr of spellChunks) {
    const [start] = parseLevelRange(chunkStr);
    if (level >= start) {
      unlocked.push(chunkStr);
    }
  }
  return unlocked;
}

function getCasualAbilitiesForLevel(casualDict, level) {
  const unlocked = [];
  for (const rangeStr of Object.keys(casualDict)) {
    const [start] = parseLevelRange(rangeStr);
    if (level >= start) {
      unlocked.push(...casualDict[rangeStr]);
    }
  }
  return unlocked;
}

function combineSpellChunks(unlockedChunks) {
  if (!unlockedChunks.length) return "";

  let minStart = Infinity;
  let maxEnd = -Infinity;

  for (const chunkStr of unlockedChunks) {
    const [start, end] = parseLevelRange(chunkStr);
    if (start < minStart) {
      minStart = start;
    }
    if (end > maxEnd) {
      maxEnd = end;
    }
  }
  return `${minStart}-${maxEnd}th`;
}

/* ------------------ Main build function ------------------ */
function buildCharacterSheet(selectedClasses) {
  let dndClassesList = [];
  let allWeapons = [];
  let allTools = [];
  let allResImmunities = [];

  const spellsByClass = [];
  const casualByClass = [];

  selectedClasses.forEach(({ className, level }) => {
    const data = classesData[className];
    if (!data) return;

    const classTitle = titleCase(className);
    dndClassesList.push(`${classTitle} [${level}]`);

    if (data.weapons) {
      allWeapons.push(...data.weapons);
    }
    if (data.tools) {
      allTools.push(...data.tools);
    }

    // Resistances/Immunities with class tag header
    if (data.resistances_immunities) {
      allResImmunities.push(`${classTitle} R/I:`);
      data.resistances_immunities.forEach((ri) => {
        allResImmunities.push(ri);
      });
    }

    // Spell Chunks
    const sc = data.spell_chunks || [];
    const unlockedSpellChunks = getSpellChunksForLevel(sc, level);
    const isAll = (unlockedSpellChunks.length === sc.length && sc.length > 0) || (sc.length === 0);
    spellsByClass.push({
      classTitle,
      isAll,
      unlockedChunks: unlockedSpellChunks,
    });

    // Casual Abilities
    const ca = data.casual_abilities || {};
    const unlockedAbilities = getCasualAbilitiesForLevel(ca, level);
    casualByClass.push({
      classTitle,
      abilities: unlockedAbilities,
    });
  });

  // Remove duplicates while preserving order
  const makeUnique = (arr) => [...new Set(arr)];

  return {
    dndClasses: dndClassesList.join(", "),
    weapons: makeUnique(allWeapons),
    tools: makeUnique(allTools),
    resistImmunities: makeUnique(allResImmunities),
    spellsByClass,
    casualByClass,
  };
}

/* ------------------ React Component ------------------ */

function App() {
  // --- All the same states as before ---
  const [name, setName] = useState("");
  const [age, setAge] = useState("ADULT");
  const [gender, setGender] = useState("");
  const [patron, setPatron] = useState("");
  const [personality, setPersonality] = useState("");
  const [alignment, setAlignment] = useState("");
  const [morality, setMorality] = useState("");
  const [race, setRace] = useState("");
  const [job, setJob] = useState("");
  const [backstory, setBackstory] = useState("");
  const [gold, setGold] = useState("");

  // Stats
  const [strength, setStrength] = useState("");
  const [intelligence, setIntelligence] = useState("");
  const [charisma, setCharisma] = useState("");
  const [wisdom, setWisdom] = useState("");
  const [constitution, setConstitution] = useState("");
  const [dexterity, setDexterity] = useState("");
  const [ac, setAc] = useState("");
  const [stealth, setStealth] = useState("");
  const [intimidation, setIntimidation] = useState("");
  const [investigation, setInvestigation] = useState("");
  const [hp, setHp] = useState("");
  const [speed, setSpeed] = useState("");
  const [modifier, setModifier] = useState("");

  // Feat / Unique items
  const [feat, setFeat] = useState("");
  const [uniqueItems, setUniqueItems] = useState("");

  // Class Selection
  const [classNameInput, setClassNameInput] = useState(Object.keys(classesData)[0]);
  const [classLevelInput, setClassLevelInput] = useState(1);
  const [selectedClasses, setSelectedClasses] = useState([]);

  // These two new states are for managing multiple saves
  const [saveName, setSaveName] = useState("");
  const [loadName, setLoadName] = useState("");

  // We'll also keep a list of available saves to populate a dropdown
  const [availableSaves, setAvailableSaves] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredClassSuggestions = Object.keys(classesData).filter((classKey) =>
    classKey.toLowerCase().includes(classNameInput.toLowerCase())
    );


  // --- Functions for adding/removing classes ---
  const addClassSelection = () => {
    if (!classNameInput) return;
    setSelectedClasses((prev) => [
      ...prev,
      { className: classNameInput, level: parseInt(classLevelInput, 10) },
    ]);
  };

  const removeClassSelection = (index) => {
    setSelectedClasses((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Build final aggregated data (same logic as before) ---
  const aggregated = buildCharacterSheet(selectedClasses);

  // --- Utility to refresh available saves from localStorage ---
  const refreshAvailableSaves = () => {
    const stored = localStorage.getItem("myDndCharacters");
    if (!stored) {
      setAvailableSaves([]);
      return;
    }
    const allSaves = JSON.parse(stored);
    setAvailableSaves(Object.keys(allSaves));
  };

  // --- On component mount, load up the available saves ---
  useEffect(() => {
    refreshAvailableSaves();
  }, []);

  // --- Save current character under "saveName" ---
  const handleSave = () => {
    if (!saveName) {
      alert("Please provide a save name first.");
      return;
    }
    const stored = localStorage.getItem("myDndCharacters");
    let allSaves = stored ? JSON.parse(stored) : {};

    const characterData = {
      name,
      age,
      gender,
      patron,
      personality,
      alignment,
      morality,
      race,
      job,
      backstory,
      gold,
      strength,
      intelligence,
      charisma,
      wisdom,
      constitution,
      dexterity,
      ac,
      stealth,
      intimidation,
      investigation,
      hp,
      speed,
      modifier,
      feat,
      uniqueItems,
      selectedClasses,
    };

    // Save/overwrite under the chosen saveName
    allSaves[saveName] = characterData;
    localStorage.setItem("myDndCharacters", JSON.stringify(allSaves));
    alert(`Character saved as "${saveName}"!`);

    // Refresh the list of available saves
    refreshAvailableSaves();
  };

  // --- Load from selected "loadName" ---
  const handleLoad = () => {
    if (!loadName) {
      alert("No save selected.");
      return;
    }
    const stored = localStorage.getItem("myDndCharacters");
    if (!stored) {
      alert("No saves found in local storage.");
      return;
    }
    const allSaves = JSON.parse(stored);
    const data = allSaves[loadName];
    if (!data) {
      alert(`No saved data found for "${loadName}".`);
      return;
    }

    // Update the states with loaded data
    setName(data.name);
    setAge(data.age);
    setGender(data.gender);
    setPatron(data.patron);
    setPersonality(data.personality);
    setAlignment(data.alignment);
    setMorality(data.morality);
    setRace(data.race);
    setJob(data.job);
    setBackstory(data.backstory);
    setGold(data.gold);
    setStrength(data.strength);
    setIntelligence(data.intelligence);
    setCharisma(data.charisma);
    setWisdom(data.wisdom);
    setConstitution(data.constitution);
    setDexterity(data.dexterity);
    setAc(data.ac);
    setStealth(data.stealth);
    setIntimidation(data.intimidation);
    setInvestigation(data.investigation);
    setHp(data.hp);
    setSpeed(data.speed);
    setModifier(data.modifier);
    setFeat(data.feat);
    setUniqueItems(data.uniqueItems);
    setSelectedClasses(data.selectedClasses);

    alert(`Loaded character: "${loadName}"`);
  };

  // --- Reset just clears everything on screen (but does NOT delete from localStorage) ---
  const handleReset = () => {
    setName("");
    setAge("ADULT");
    setGender("");
    setPatron("");
    setPersonality("");
    setAlignment("");
    setMorality("");
    setRace("");
    setJob("");
    setBackstory("");
    setGold("");
    setStrength("");
    setIntelligence("");
    setCharisma("");
    setWisdom("");
    setConstitution("");
    setDexterity("");
    setAc("");
    setStealth("");
    setIntimidation("");
    setInvestigation("");
    setHp("");
    setSpeed("");
    setModifier("");
    setFeat("");
    setUniqueItems("");
    setSelectedClasses([]);
    alert("All fields reset (not removed from storage).");
  };

  // --- Produce the final text (same as before) ---
  const renderSheetText = () => {
    const spellsLine = aggregated.spellsByClass
      .map(({ classTitle, isAll, unlockedChunks }) => {
        if (isAll) return `[All of ${classTitle}]`;
        if (!unlockedChunks.length) return "";
        const combined = combineSpellChunks(unlockedChunks);
        return `[${combined} ${classTitle}]`;
      })
      .filter(Boolean)
      .join(", ");

    const casualLine = aggregated.casualByClass
      .map(({ abilities }) => {
        if (!abilities.length) return "";
        return `[${abilities.join(", ")}]`;
      })
      .filter(Boolean)
      .join(", ");

    return `Name: ${name}

Age: ${age}

Gender: ${gender}

Patron: ${patron}

Personality: ${personality}

Alignment: ${alignment}

Morality: ${morality}

Race: ${race}

DND Classes: ${aggregated.dndClasses}

Job: ${job}

Level: Matches the Party

Backstory: ${backstory}

Gold: ${gold}

🌧️
🔥
[Stats]
Strength: ${strength}
Intelligence: ${intelligence}
Charisma: ${charisma}
Wisdom: ${wisdom}
Constitution: ${constitution}
Dexterity: ${dexterity}
AC: ${ac}
Stealth: ${stealth}
Intimidation: ${intimidation}
Investigation: ${investigation}
HP: ${hp}
Speed: ${speed}
Modifier: ${modifier}

🪛
🪓
Weapons: ${aggregated.weapons.join(", ")}

Spells: ${spellsLine}

Feat: ${feat}

Tools: ${aggregated.tools.join(", ")}

Casual Abilities: ${casualLine}

Resistances/Immunities: ${aggregated.resistImmunities.join(", ")}

Unique Items: ${uniqueItems}
`;
  };

  return (
    <div className="app-container">
      {/* Left Column: Form */}
      <div className="form-column">
        <h1>Character Sheet Creator</h1>

        {/* Basic Info */}
        <div className="field-group">
          <label>Name:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Age:</label>
          <input value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Gender:</label>
          <input value={gender} onChange={(e) => setGender(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Patron:</label>
          <input value={patron} onChange={(e) => setPatron(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Personality:</label>
          <input
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Alignment:</label>
          <input
            value={alignment}
            onChange={(e) => setAlignment(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Morality:</label>
          <input
            value={morality}
            onChange={(e) => setMorality(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Race:</label>
          <input value={race} onChange={(e) => setRace(e.target.value)} />
        </div>

        {/* Classes */}
        <h3>Add Classes</h3>
        <div className="field-group">
          <div style={{ position: "relative", width: "50%" }}>
            <input
                type="text"
                placeholder="Type or select class"
                value={classNameInput}
                onChange={(e) => {
                setClassNameInput(e.target.value);
                setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // delay so click can register
                style={{ width: "100%", padding: "8px" }}
            />
            {showSuggestions && filteredClassSuggestions.length > 0 && (
                <ul
                style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    border: "1px solid #ccc",
                    borderTop: "none",
                    maxHeight: "150px",
                    overflowY: "auto",
                    position: "absolute",
                    width: "100%",
                    background: "#fff",
                    zIndex: 10,
                }}
                >
                {filteredClassSuggestions.map((suggestion) => (
                    <li
                    key={suggestion}
                    onClick={() => {
                        setClassNameInput(suggestion);
                        setShowSuggestions(false);
                    }}
                    style={{
                        padding: "8px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                    }}
                    >
                    {suggestion}
                    </li>
                ))}
                </ul>
            )}
            </div>

          <label style={{ padding: "5px", width: "60px" }}>Level:</label>
          <input
            type="number"
            min={1}
            max={30}
            value={classLevelInput}
            onChange={(e) => setClassLevelInput(e.target.value)}
            style={{ width: 30 }}
          />

          <button onClick={addClassSelection}>Add Class</button>
        </div>
        <ul className="selected-classes-list">
          {selectedClasses.map(({ className, level }, i) => (
            <li key={i}>
              {className} [Level {level}]
              <button onClick={() => removeClassSelection(i)}>Remove</button>
            </li>
          ))}
        </ul>

        {/* Additional Info */}
        <div className="field-group">
          <label>Job:</label>
          <input value={job} onChange={(e) => setJob(e.target.value)} />
        </div>
        <div className="field-group" style={{ alignItems: "flex-start" }}>
          <label style={{ marginTop: 4 }}>Backstory:</label>
          <textarea
            rows={3}
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Gold:</label>
          <input value={gold} onChange={(e) => setGold(e.target.value)} />
        </div>

        {/* Stats */}
        <h3>Stats</h3>
        <div className="field-group">
          <label>Strength:</label>
          <input value={strength} onChange={(e) => setStrength(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Intelligence:</label>
          <input
            value={intelligence}
            onChange={(e) => setIntelligence(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Charisma:</label>
          <input value={charisma} onChange={(e) => setCharisma(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Wisdom:</label>
          <input value={wisdom} onChange={(e) => setWisdom(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Constitution:</label>
          <input
            value={constitution}
            onChange={(e) => setConstitution(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Dexterity:</label>
          <input
            value={dexterity}
            onChange={(e) => setDexterity(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>AC:</label>
          <input value={ac} onChange={(e) => setAc(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Stealth:</label>
          <input value={stealth} onChange={(e) => setStealth(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Intimidation:</label>
          <input
            value={intimidation}
            onChange={(e) => setIntimidation(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Investigation:</label>
          <input
            value={investigation}
            onChange={(e) => setInvestigation(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>HP:</label>
          <input value={hp} onChange={(e) => setHp(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Speed:</label>
          <input value={speed} onChange={(e) => setSpeed(e.target.value)} />
        </div>
        <div className="field-group">
          <label>Modifier:</label>
          <input
            value={modifier}
            onChange={(e) => setModifier(e.target.value)}
          />
        </div>

        {/* Feat and Unique Items */}
        <div className="field-group">
          <label>Feat:</label>
          <input value={feat} onChange={(e) => setFeat(e.target.value)} />
        </div>
        <div className="field-group" style={{ alignItems: "flex-start" }}>
          <label style={{ marginTop: 4 }}>Unique Items:</label>
          <textarea
            rows={3}
            value={uniqueItems}
            onChange={(e) => setUniqueItems(e.target.value)}
          />
        </div>

        {/* Save/Load fields */}
        <h3>Save / Load</h3>
        {/* Save Name input */}
        <div className="field-group">
          <label>Save Name:</label>
          <input
            placeholder="Type a name for your save"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <button onClick={handleSave}>Save</button>
        </div>

        {/* Load from dropdown */}
        <div className="field-group">
          <label>Load:</label>
          <select
            value={loadName}
            onChange={(e) => setLoadName(e.target.value)}
            style={{ maxWidth: "200px" }}
          >
            <option value="">--Select--</option>
            {availableSaves.map((saveKey) => (
              <option key={saveKey} value={saveKey}>
                {saveKey}
              </option>
            ))}
          </select>
          <button onClick={handleLoad}>Load</button>
        </div>

        <div style={{ marginTop: "8px" }}>
          <button onClick={handleReset}>Reset Fields</button>
        </div>
      </div>

      {/* Right Column: Final Character Sheet */}
      <div className="output-column">
        <h2>Final Character Sheet</h2>
        <textarea
          className="character-sheet-output"
          readOnly
          value={renderSheetText()}
        />
      </div>
    </div>
  );
}

export default App;