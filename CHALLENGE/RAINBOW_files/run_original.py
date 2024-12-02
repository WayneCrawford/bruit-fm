from obspy.core.stream import read
from obspy import read_inventory\
from obspy.signal import PPSD
from tiskitpy import SpectralDensity, ResponseFunctions

from output_compliance import output_compliance


# read the data and metadata
stream = read('XX.AS02.mseed')
inv = read_inventory('AS02_L.station.xml')

# Plot waveforms
stream.plot(equal_scale=False)  # plots to screen for verification
stream.plot(equal_scale=False, outfile='plots/AS02.streamplot.png')

# Calculate and plot Z-channel PPSD
ppsd = PPSD(stream.select(channel='LHZ')[0].stats, inv)
ppsd.add(stream)
ppsd.plot(period_lim=(1, 600))
ppsd.plot(period_lim=(1, 600), filename='plots/AS02.Z-PPSD.png')

# Calculate spectral density and coherence
sd = SpectralDensity.from_stream(stream, inv=inv)

# Plot Z-H coherence
sd.plot_one_coherence('*Z', '*H', outfile=f'plots/AS02.ZHcoher.png')

# Calculate and plot compliance
rf = ResponseFunctions(sd, '*H', ['*Z'])
rf.plot(outfile=f'plots/AS02.ZHrf.png')
wdepth = 2554  # Water depth in meters
rf.to_norm_compliance(wdepth)
rf.plot(outfile=f'plots/AS02.compl.png')

# Output compliance
output_compliance(rf, 'AS02')
