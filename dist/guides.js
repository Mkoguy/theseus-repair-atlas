1// The starter atlas is deliberately curated. Model-specific electronics repairs
// point readers to the exact-device source instead of pretending one procedure
// fits every product. Add new guides here without changing the UI code.
export const guides = [
  {
    id: 'bicycle-flat', title: 'Patch a bicycle inner tube', category: 'Bikes', action: 'Patch',
    difficulty: 'Beginner', minutes: 30, art: 'wheel', featured: true,
    summary: 'Find the puncture, patch the tube, and get rolling again.',
    intro: 'For a standard bicycle tire with an inner tube. Tubeless setups need a different repair.',
    safety: 'Check the tire for glass or thorns before putting the tube back. Replace a torn tire rather than relying on a temporary boot for regular riding.',
    tools: ['Tire levers', 'Pump', 'Marker', 'Clean cloth'],
    parts: ['Tube patch kit', 'Replacement tube if the damage is large'],
    partsQuery: 'bicycle inner tube patch kit tire levers',
    steps: [
      ['Remove the wheel and tube', 'Release the brake if needed, deflate the tire fully, and use tire levers to lift one bead. Pull out the tube without pinching it.'],
      ['Find and mark the leak', 'Inflate the tube slightly. Listen or use water to find bubbles, then mark the puncture and inspect the matching spot inside the tire.'],
      ['Prepare the patch area', 'Dry and clean the tube. Lightly roughen an area larger than the patch, following the instructions for your patch kit.'],
      ['Apply the patch', 'Use the kit’s adhesive or self-adhesive patch as directed. Press firmly, especially around the edges.'],
      ['Reinstall and test', 'Put the tube back without twists, seat the tire bead, inflate to the tire’s marked range, and check that it holds air.']
    ],
    source: { label: 'Park Tool repair guide', url: 'https://www.parktool.com/en-us/blog/repair-help/inner-tube-repair' },
    video: { label: 'Park Tool: patch a flat tire', provider: 'YouTube', id: 'dxF82SIb6gw', url: 'https://www.youtube.com/watch?v=dxF82SIb6gw' }
  },
  {
    id: 'leaky-faucet', title: 'Stop a dripping faucet', category: 'Home', action: 'Repair',
    difficulty: 'Beginner', minutes: 45, art: 'faucet', featured: true,
    summary: 'A calm way to diagnose the drip and replace the worn part.',
    intro: 'Faucet designs vary. Identify the make and model before buying a cartridge, washer, or O-ring.',
    safety: 'Turn off the water supply and open the faucet to release pressure. If a shutoff valve will not close, stop and get help before disassembly.',
    tools: ['Adjustable wrench', 'Screwdriver', 'Cloth or towel'],
    parts: ['Model-matched cartridge, washer, or O-ring'],
    partsQuery: 'faucet replacement cartridge washer o ring',
    steps: [
      ['Shut off and protect', 'Close the supply valves, open the faucet to drain it, and cover the drain so small screws cannot disappear.'],
      ['Identify the faucet', 'Find the model number if possible. Photograph the handle and internal part before removing anything.'],
      ['Inspect the worn part', 'Remove the handle as the manufacturer directs. Look for a damaged washer, O-ring, or cartridge and match it exactly.'],
      ['Replace and reassemble', 'Fit the replacement in the same orientation and reassemble without overtightening.'],
      ['Test slowly', 'Restore water gradually and check for drips at the spout, handle, and supply connections.']
    ],
    source: { label: 'Home Depot repair video', url: 'https://videos.homedepot.com/detail/video/5733914120001/how-to-fix-a-leaky-faucet' },
    video: { label: 'How to fix a leaky faucet', provider: 'Home Depot', url: 'https://videos.homedepot.com/detail/video/5733914120001/how-to-fix-a-leaky-faucet' }
  },
  {
    id: 'drywall-hole', title: 'Patch a small drywall hole', category: 'Home', action: 'Patch',
    difficulty: 'Beginner', minutes: 60, art: 'wall', featured: true,
    summary: 'Turn a dent or small hole into a smooth, paint-ready wall.',
    intro: 'This covers small non-structural holes. Large openings, moisture damage, or electrical hazards need a different approach.',
    safety: 'Check for wiring and plumbing before cutting or driving anything into a wall. Wear eye protection while sanding.',
    tools: ['Putty knife', 'Fine sanding block', 'Dust cloth'],
    parts: ['Spackle or joint compound', 'Patch for larger small holes', 'Primer and matching paint'],
    partsQuery: 'drywall repair patch spackle putty knife',
    steps: [
      ['Inspect the damage', 'Make sure the wall is dry and the damage is only surface-level. Remove loose paper or crumbling material.'],
      ['Fill or cover', 'For a tiny hole, press in spackle. For a wider small hole, use a suitable patch before applying compound.'],
      ['Feather the edges', 'Use a putty knife to spread thin layers beyond the damaged area. Let each layer dry fully.'],
      ['Sand lightly', 'Smooth the dry repair without digging into the wall, then remove all dust.'],
      ['Finish the surface', 'Prime the patch and apply matching paint after the primer dries.']
    ],
    source: { label: 'Home Depot video guide', url: 'https://videos.homedepot.com/detail/videos/lumber-building-materials/video/4411939780001/repairing-small-holes-in-drywall' },
    video: { label: 'Repairing small holes in drywall', provider: 'Home Depot', url: 'https://videos.homedepot.com/detail/videos/lumber-building-materials/video/4411939780001/repairing-small-holes-in-drywall' }
  },
  {
    id: 'zipper-slider', title: 'Replace a jacket zipper slider', category: 'Clothing', action: 'Replace',
    difficulty: 'Intermediate', minutes: 30, art: 'zipper', featured: false,
    summary: 'Keep the jacket. Swap the small part that makes the zip work.',
    intro: 'Start by identifying the zipper type and size. This is for a slider problem, not torn zipper tape or missing teeth.',
    safety: 'Use scissors and pliers carefully. If the zipper is sewn into delicate or waterproof fabric, consider a professional repair.',
    tools: ['Needle-nose pliers', 'Needle', 'Scissors'],
    parts: ['Matching zipper slider', 'Thread or replacement top stop'],
    partsQuery: 'matching jacket zipper slider replacement',
    steps: [
      ['Diagnose the zipper', 'Check whether the teeth are intact and the slider is the failing part. Read the size stamped on the slider if present.'],
      ['Match the replacement', 'Choose a slider for the same tooth type and size; coil, plastic tooth, and metal zippers are not interchangeable.'],
      ['Remove the old slider', 'Follow the source guide for the zipper’s construction, removing the stop only if the repair requires it.'],
      ['Fit and secure', 'Slide the replacement on in the correct orientation, then restore the stop or sew a secure thread stop.'],
      ['Test gently', 'Zip and unzip slowly several times and check that both sides stay aligned.']
    ],
    source: { label: 'iFixit zipper guide', url: 'https://www.ifixit.com/Guide/How%2Bto%2Breplace%2Ba%2Bzipper%2Bslider/169519' },
    video: { label: 'iFixit video: replace a zipper slider', provider: 'iFixit', url: 'https://www.ifixit.com/Guide/Video%3A%2BHow%2Bto%2BReplace%2Ba%2BZipper%2BSlider/94975' }
  },
  {
    id: 'sew-button', title: 'Sew a button back on', category: 'Clothing', action: 'Repair',
    difficulty: 'Beginner', minutes: 15, art: 'button', featured: false,
    summary: 'A tiny repair that can rescue a favorite shirt or coat.',
    intro: 'A basic hand-sewn four-hole button. Heavy coats may need a raised thread shank instead.',
    safety: 'Keep needles and spare buttons away from young children. Use a thimble if you need extra finger protection.',
    tools: ['Hand-sewing needle', 'Scissors', 'Tailor’s chalk (optional)'],
    parts: ['Matching button', 'Matching thread'],
    partsQuery: 'four hole sewing buttons matching thread needle',
    steps: [
      ['Mark the position', 'Align the buttonhole and mark where the button belongs on the fabric.'],
      ['Thread the needle', 'Choose thread that matches the garment, double it if needed, and knot the end.'],
      ['Attach the button', 'Sew up through the fabric and button holes several times without pulling so tightly that the fabric puckers.'],
      ['Secure the thread', 'Knot the thread on the underside, trim it, and test the button through its buttonhole.']
    ],
    source: { label: 'iFixit hand-sewing guide', url: 'https://www.ifixit.com/Guide/Sew%2Ba%2BButton/19501' },
    video: null
  },
  {
    id: 'laptop-battery', title: 'Plan a laptop battery replacement', category: 'Electronics', action: 'Replace',
    difficulty: 'Intermediate', minutes: 60, art: 'laptop', featured: false,
    summary: 'Find the exact battery and guide before opening a laptop.',
    intro: 'Laptop batteries and opening steps are model-specific. Use this checklist to prepare, then follow the guide for your exact model.',
    safety: 'A swollen, punctured, hot, or damaged lithium battery needs special handling. Stop and contact a qualified repair service. Never bend or puncture a battery.',
    tools: ['Exact-model repair guide', 'Manufacturer-approved screwdrivers', 'Non-metal opening tool'],
    parts: ['Battery matched to the exact laptop model'],
    partsQuery: 'laptop replacement battery exact model',
    steps: [
      ['Find the exact model', 'Record the manufacturer, model, and battery part number from the label or system information.'],
      ['Check the repair path', 'Read a guide for that exact model all the way through. Confirm the required tools, adhesives, and battery handling steps.'],
      ['Choose a compatible part', 'Compare the part number, connector, voltage, and seller information before buying.'],
      ['Power down and follow the model guide', 'Unplug the laptop, follow its official or model-specific disassembly steps, and disconnect the battery before other internal work.'],
      ['Test and recycle', 'After reassembly, test charging and recycle the old battery through an appropriate collection program.']
    ],
    source: { label: 'iFixit laptop repair hub', url: 'https://www.ifixit.com/Device/PC_Laptop' },
    video: { label: 'iFixit: replace a PC laptop battery', provider: 'YouTube', id: 'HGlMWYK9HmQ', url: 'https://www.youtube.com/watch?v=HGlMWYK9HmQ' }
  },
  {
    id: 'window-screen', title: 'Repair a torn window screen', category: 'Home', action: 'Patch',
    difficulty: 'Beginner', minutes: 35, art: 'screen', featured: false,
    summary: 'Keep bugs out without replacing the entire window.',
    intro: 'A small tear can be patched; a badly damaged screen may need new mesh and spline.',
    safety: 'Remove the screen carefully and avoid leaning out of a window. Wear gloves around sharp frame edges.',
    tools: ['Scissors', 'Spline roller if replacing mesh', 'Gloves'],
    parts: ['Screen patch or replacement mesh', 'Matching spline if replacing mesh'],
    partsQuery: 'window screen repair patch mesh spline roller',
    steps: [
      ['Assess the tear', 'Check whether a small patch will cover it securely or whether the full mesh needs replacing.'],
      ['Clean and measure', 'Remove dust and measure the damaged area or the whole frame, depending on your repair.'],
      ['Patch or replace', 'Apply a compatible patch, or fit new mesh into the frame channel with the proper spline.'],
      ['Trim and reinstall', 'Trim excess material, check the edges, and put the screen back in its frame.']
    ],
    source: { label: 'Home Depot screen guide', url: 'https://www.homedepot.com/c/ah/how-to-repair-or-replace-window-screens/9ba683603be9fa5395fab901c4aa0dc0' },
    video: null
  },
  {
    id: 'phone-screen', title: 'Prepare for a phone screen repair', category: 'Electronics', action: 'Replace',
    difficulty: 'Advanced', minutes: 90, art: 'phone', featured: false,
    summary: 'Check the exact model, part, and risks before touching adhesive.',
    intro: 'Phone screen replacement is highly model-specific. The linked video is an iPhone 15 Pro example, not a universal procedure.',
    safety: 'A cracked screen can shed glass and the battery can be damaged by the wrong tool. If the battery is swollen or you cannot find an exact-model guide, use a qualified repair service.',
    tools: ['Exact-model guide', 'Eye protection', 'Model-specific opening tools'],
    parts: ['Exact-model replacement display', 'Required replacement adhesive'],
    partsQuery: 'phone replacement display exact model repair kit',
    steps: [
      ['Identify the model', 'Use the phone’s model number, not just the product family name.'],
      ['Read the exact procedure', 'Check an official or trusted guide for that specific model, including battery and adhesive precautions.'],
      ['Check the part', 'Confirm display generation, connector, included adhesives, and any post-repair calibration requirements.'],
      ['Decide whether to proceed', 'If the procedure exceeds your tools or experience, compare a professional repair quote before opening the device.']
    ],
    source: { label: 'iFixit phone repair hub', url: 'https://www.ifixit.com/Device/Phone' },
    video: { label: 'Example: iPhone 15 Pro screen repair', provider: 'YouTube', id: 'eLco5qP4LOM', url: 'https://www.youtube.com/watch?v=eLco5qP4LOM' }
  }
]

export const categories = ['All', 'Electronics', 'Home', 'Clothing', 'Bikes']
