import makerjs from 'makerjs';

function booleanUnionSVG(svgClone) {
  // 1️⃣ collect the geometry you want to weld
  const pathEls = [...svgClone.querySelectorAll(
    '.antenna-tooth-filled'   // tweak selectors as needed
  )];

  if (pathEls.length === 0) return;  // nothing to do

  // 2️⃣ turn the first path into the running union
  let unionModel = makerjs.importer.fromSVGPathData(pathEls[0].getAttribute('d'));

  // 3️⃣ fold the rest in
  for (let i = 1; i < pathEls.length; i++) {
    const nextModel = makerjs.importer.fromSVGPathData(pathEls[i].getAttribute('d'));
    unionModel = makerjs.model.combineUnion(unionModel, nextModel);
  }

  // (optional) keep everything in millimetres for export-consistency
  makerjs.model.convertUnits(unionModel, makerjs.unitType.Millimeter);

  // 4️⃣ get one fat path back
  const unionSvgString = makerjs.exporter.toSVG(unionModel, {
    units: 'mm',
    useSvgPathOnly: true,     // path-only mode gives a single <path>
    strokeWidth: '0.25mm',    // match your on-screen style
    stroke: 'black',
    fillRule: 'evenodd'
  });

  // 5️⃣ replace the old shapes in the clone
  pathEls.forEach(el => el.remove());
  const unionPath = new DOMParser()
      .parseFromString(unionSvgString, 'image/svg+xml')
      .querySelector('path');
  svgClone.querySelector('#antenna-group').appendChild(unionPath); // adjust group id
}
