Pod::Spec.new do |s|
  s.name           = 'ExpoTrustCore'
  s.version        = '0.1.0'
  s.summary        = 'Multi-blockchain wallet SDK for Expo'
  s.description    = 'Expo module for Trust Wallet Core - Multi-blockchain wallet functionality'
  s.author         = 'GESP'
  s.homepage       = 'https://github.com/gesp/expo-trust-core'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'TrustWalletCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
