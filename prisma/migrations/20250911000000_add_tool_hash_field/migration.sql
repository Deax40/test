-- Add hash column to Tool and backfill values
ALTER TABLE "Tool" ADD COLUMN "hash" TEXT;

-- Backfill known hashes by tool name
UPDATE "Tool" AS t SET "hash" = v.hash
FROM (
VALUES
  ('Camera d''inspection Gleize', '28e21791f8ad1d677a8dd01ec66bad490897748e0471fad7a9e2da08aa6d5116'),
  ('Camera d''inspection Paris', 'f65f52f425d18e0ebb765bcadf0b8848a87c55a573e70e9413768ff5bf483d62'),
  ('Capteur pression Gleize', 'd4132d78e5faecf4a32ae3c3d43eae2393320325e64c8d4877ed192f85f85ca3'),
  ('Clef serre tube Gleize', 'e0d338d187be0a8befae4941759c83597df7c6fd0383cc6e5e1b46388b8e09f9'),
  ('Cle Demontage Ecrou injection 155', 'df356c59532f844b3f19831c01fa17efabc9bf7acf18e8f56c27b51bc2e91a59'),
  ('Cle Demontage Ecrou injection 180', 'fc75f6b97dc9d2dbdd1de74bcafbea0323c9a3eec5e3496cc6fec6272ac86f74'),
  ('Extracteur a choc', '9885179c67e34979c2a066f4eb85602ba567ab1e2e5c74ec5a6d0e5f924c8976'),
  ('cle dynamometrique Gleize', '8cd4286fc6ef29feee992642cb4effdb45abbf0db8f32a557131006d977e5daa'),
  ('Cle Hydraulique', 'c09a90427a0bfcbbc53d2ee0ecd6b92163de91904cfd3ccb2410fba802c40d2a'),
  ('Cle Demontage Ecrou injection 320', 'a171feea2e523a89655015f1c3a28ae07c6f9f6a3c7d7d84e2e4be6a365649c8'),
  ('Cle Demontage Ecrou injection 360', 'ce906580036e266eee66695e263c96fa05ae1c0c57e7c2437460c8d3ab664f64'),
  ('Cle Demontage Ecrou injection 271', '13878e5ac1e6eb946dc359372ffb8278f26ffdb61858e52677dd5b16bb69a70e'),
  ('Cle Demontage Ecrou injection 300', '98272abe8a8a5f374de4b895db9e9dd014a9ff94faef0dca771b40042ba40333'),
  ('Cle Demontage Ecrou injection 215', '5b7135892140d0799f7d223889574c5e357d11c960e55a31989fbd65df2f0a1f'),
  ('Cle Demontage Ecrou injection 195', '447c40cd8fbd95de389888622a79cbac6aa02631fdbd9ba5fbe28f2f08c214f6'),
  ('kit changement codeur Baumueller Gleize', '12076448b7af17ab31f5ed710fb21c82ec9cc45855e21b00f8e48cbfa0cd7b8c'),
  ('Kit charge accu', '8c9092b1323e559f3c6edf26e62b1b0f18a77e3ce5eb095811dcfd97cf0047bc'),
  ('jeux demontage vis a billes Paris', '10f8cf51cdda486bc7b7209f10329e5ef3573a60a48e58e50f60b2eeade9fec8'),
  ('jeux demontage vis a billes Gleize', 'a38c6c44a58025e5869de2fd8e9fbf0e5555f63b7b6bc82dd57a974dd37ef8c0'),
  ('Extracteur Hydraulique Paris', 'dd6bba80f1afb443646b627945dea13e934460c244bf0c9b8781fad2c48a4d97'),
  ('Jeu de Tournevis (Outil de demontage joint) Paris', '6beb97aebcb3e1d7a1d1018ccc18bdcaaa8272480b20b81c9f88883d5445d386'),
  ('Jeu de cles a ergots', 'b3d20d225cba3ec867453070bfb34d6ab8eca23f99e2c2933233be0629f7cd3c'),
  ('douilles visseuse Gleize', '86dbe80467a55d92a092e053738a849d4a89f0b9b33c351d62cff79ad6e3b749'),
  ('Cricket Hydraulique 4 Tonnes', '3374866e53a99772c30e6399ca5d2fb14d76549fca7091ff0b418775a5c56f50'),
  ('comparateur interieur pour controle fourreau', 'ebabace95e7bd3fd76a6966255462950acef16c8ba5f08ee146417ea9db2cfce'),
  ('cle plate diam 70 Gleize', '5ce7c2e75b0ff1f888af60f4ef2622d822dd7e11346faeb8af644315fba7e77b'),
  ('Pince a cercler les joints Gleize', '096247e176d9f4fffb429cfdd499cb16fe1ea260d7321fa8590ef6074932e4f0'),
  ('Outil Demontage Ecrou Colonne DUO', '37cfcee4ad21b8b628f145accb30c2c6685435f56d40421f2ee5b9081249e577'),
  ('Niveau a cadre Gleize', '67a7576288b963423b790e5191f232cdf10b50c227193e6597a1b734e1f4041f'),
  ('Micrometre interieur controle fourreau (diam 50-100)', '5284bdddb151c8247e69bd79786babe61cf4acd65b4c48422846c722c4c34b93'),
  ('Micrometre exterieur vis', '2b8ddf0c206382d83a1c416827c266cda36b505b806132c11fbc56ed7a34728a'),
  ('Micrometre exterieur vis 2', 'c0015526aea5ad8fa1fb0bdf58e2bb6e6e8453ba67c21772bc230577d04cad91'),
  ('Micrometre 3 touches diam 20-50 Paris', '36d4225d58db72cec5b239b0ab15852e756a22305bafe2fa5b7b211c52ac13ad'),
  ('Kit harnais + casque Gleize', '6138ad1075bbfceb7817cba1a1ca788e959f3dbccfd9673b9992cb944fa0ca26'),
  ('Kit de reparation standard', '8deb90eae3b8ea52a7eff72469c7f7c779108f06ad4a392be12cc8c49d1b64c0'),
  ('Visseuse électrique à choc Gleize', '7aad522290c5d9cdcd72658b47f0924cd38d895b8563f965c9ce7eb935a12788'),
  ('Vérin 30 cm Gleize', '5cdf61b264dc41d20413363d2e5a83778a4ace66afff747b47ff382c1abbfeb5'),
  ('Testeur isolement Iso-tech Gleize', 'fd51a526eed29b689168c315540ab955750c54df32f9a70ab3e26a15eb0aaabf'),
  ('Règle de niveau jeu 2 Gleize', 'e8d0fac80071e4b61078ec25cdc584abaab0fded14368b208d97a2a3a2c6f870'),
  ('Règle de niveau jeu 1 Gleize', '24b6c0acd356b54982abb2126665e88aebd056d84838dc8dcee357dc7b7a167f'),
  ('Rallonge micromètre intérieur contrôle fourreau', 'c475279b4a8dd1ddc6d4cadab70cdbff0ee01f7b61827f9282bc690d43ab1f14'),
  ('Pompe Enerpac', 'c949948a48ee25eb48760f31cbc3f7f2cd21ad44268f7651950aab5ecf0801ae'),
  ('Pince à sertir cosses 10-35', '8251c752a5fce75e0a61dc8045bc17a2a8a1424fa9e660f562e92512762b9e44'),
  ('Pince à sertir Euromap 67 Gleize', 'c7e45ca24957f9f25e4b11ba1e4ee08590722bafa0fa985997762c5b9305644f'),
  ('Pince à cercler les joints Paris', 'ff9d88ffc9fbbfe0c1e75d45f6e1114ea87ef66e9eb89582b82f45af29206fa3'),
  ('Visseuse pneumatique Gleize', '90b500633ae35252e237a34198ed214d126f608d4911ea1775b2e8b06ff44440'),
  ('Visseuse pneumatique Paris', 'e550cdac407ec7c396d0837174d09475e2ee081e721d6bb17ba06c6cd03d20ae')
) AS v(name, hash)
WHERE t.name = v.name;

-- Fallback: copy existing qrData when hash still null
UPDATE "Tool" SET "hash" = "qrData" WHERE "hash" IS NULL;

-- Enforce not null and uniqueness
ALTER TABLE "Tool" ALTER COLUMN "hash" SET NOT NULL;
CREATE UNIQUE INDEX "Tool_hash_key" ON "Tool"("hash");
