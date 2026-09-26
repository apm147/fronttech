-- QUILT ontology cross-reference for sector_taxonomy_xref, the alignment
-- guard docs/DESIGN.md left unpopulated pending "QUILT's actual category
-- codes" (Resolved Decisions #4). Source and rationale for each mapping:
-- https://github.com/apm147/innovationfunding/blob/main/FRONTIER_TECH_XREF.md
--
-- node_id is QUILT's stable taxonomy identifier (backend/data/ontology/
-- tech_ontology_v2_with_maturity.csv) -- it survives category renames, so
-- it's the right value for external_code, not the display name. Four of
-- the six map to an L1 (top-level) QUILT category; Semiconductors and
-- Advanced Connectivity are deliberately mapped one level down (L2), since
-- their L1 parents (Advanced Materials and Nanotechnology; IoT and
-- Sensors) are broader than what this tracker means by those two sectors.
INSERT INTO sector_taxonomy_xref (sector_id, external_system, external_code) VALUES
  ('quantum',        'quilt_deep_tech_ontology', 'E154'),   -- Quantum Technologies (L1)
  ('engbio',         'quilt_deep_tech_ontology', 'E85'),    -- Synthetic Biology (L1) -- QUILT's pre-existing name for Engineering Biology
  ('ai',             'quilt_deep_tech_ontology', 'E0'),     -- Digital AI (L1)
  ('semiconductors', 'quilt_deep_tech_ontology', 'E110'),   -- Advanced Materials and Nanotechnology -> Semiconductors (L2)
  ('cyber',          'quilt_deep_tech_ontology', 'N_CYB'),  -- Cybersecurity (L1)
  ('connectivity',   'quilt_deep_tech_ontology', 'E71')     -- IoT and Sensors -> Next-Generation Telecommunications (L2)
ON CONFLICT (sector_id, external_system) DO UPDATE
  SET external_code = EXCLUDED.external_code;
